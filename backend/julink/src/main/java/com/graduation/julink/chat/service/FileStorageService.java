package com.graduation.julink.chat.service;

import com.graduation.julink.chat.ChatDTOs.FileUploadResponse;
import com.graduation.julink.chat.ChatEntities.MessageType;
import com.graduation.julink.common.media.MediaUploadService;
import com.graduation.julink.common.media.MediaUploadService.ImageVariant;
import com.graduation.julink.common.media.MediaUploadService.MediaUploadRequest;
import com.graduation.julink.common.media.MediaUploadService.MediaUploadResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final MediaUploadService mediaUploadService;

    public FileUploadResponse store(MultipartFile file) throws IOException, InterruptedException {
        return store(file.getBytes(), file.getOriginalFilename(), file.getContentType());
    }

    public FileUploadResponse store(byte[] bytes, String filename, String contentType) throws IOException, InterruptedException {
        MediaUploadResult upload = mediaUploadService.upload(new MediaUploadRequest(
                bytes,
                filename,
                contentType,
                ImageVariant.CHAT
        ));

        log.info("Uploaded chat media {} ({}) to Cloudinary", upload.filename(), upload.contentType());
        return FileUploadResponse.builder()
                .mediaUrl(upload.url())
                .mediaFilename(upload.filename())
                .mediaSizeBytes(upload.sizeBytes())
                .messageType(resolveMessageType(upload.contentType()))
                .build();
    }

    private MessageType resolveMessageType(String contentType) {
        if (mediaUploadService.isImage(contentType)) return MessageType.IMAGE;
        if (mediaUploadService.isVideo(contentType)) return MessageType.VIDEO;
        if (mediaUploadService.isAudio(contentType)) return MessageType.AUDIO;
        return MessageType.FILE;
    }
}
