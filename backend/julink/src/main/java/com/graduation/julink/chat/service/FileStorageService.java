package com.graduation.julink.chat.service;

import com.graduation.julink.chat.ChatDTOs.FileUploadResponse;
import com.graduation.julink.chat.ChatEntities.MessageType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * Stores chat media files on the local filesystem and returns a public URL.
 *
 * For production swap this implementation with an S3/GCS/Azure Blob adapter —
 * the ChatService only depends on this interface.
 */
@Slf4j
@Service
public class FileStorageService {

    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final Set<String> VIDEO_TYPES = Set.of("video/mp4", "video/quicktime", "video/webm");
    private static final Set<String> AUDIO_TYPES = Set.of("audio/mpeg", "audio/ogg", "audio/wav", "audio/aac");
    private static final long MAX_FILE_SIZE_BYTES = 50L * 1024 * 1024; // 50 MB

    @Value("${app.upload.dir:uploads/chat}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public FileUploadResponse store(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File exceeds maximum allowed size of 50 MB");
        }

        String contentType = file.getContentType();
        MessageType messageType = resolveMessageType(contentType);

        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);
        String storedFilename = UUID.randomUUID() + extension;

        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);

        Path destination = uploadPath.resolve(storedFilename);
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        String mediaUrl = baseUrl + "/uploads/chat/" + storedFilename;

        log.info("Stored file {} as {} ({})", originalFilename, storedFilename, contentType);

        return FileUploadResponse.builder()
                .mediaUrl(mediaUrl)
                .mediaFilename(originalFilename)
                .mediaSizeBytes(file.getSize())
                .messageType(messageType)
                .build();
    }

    private MessageType resolveMessageType(String contentType) {
        if (contentType == null) return MessageType.FILE;
        if (IMAGE_TYPES.contains(contentType)) return MessageType.IMAGE;
        if (VIDEO_TYPES.contains(contentType)) return MessageType.VIDEO;
        if (AUDIO_TYPES.contains(contentType)) return MessageType.AUDIO;
        return MessageType.FILE;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
    }
}
