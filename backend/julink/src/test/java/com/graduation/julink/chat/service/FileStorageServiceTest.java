package com.graduation.julink.chat.service;

import com.graduation.julink.chat.ChatDTOs.FileUploadResponse;
import com.graduation.julink.chat.ChatEntities.MessageType;
import com.graduation.julink.common.media.MediaUploadService;
import com.graduation.julink.common.media.MediaUploadService.MediaUploadResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileStorageServiceTest {

    @Mock
    private MediaUploadService mediaUploadService;

    @Mock
    private MultipartFile multipartFile;

    @InjectMocks
    private FileStorageService fileStorageService;

    @Test
    void store_ImageSuccess() throws Exception {
        when(multipartFile.getBytes()).thenReturn("test".getBytes());
        when(multipartFile.getContentType()).thenReturn("image/png");
        when(multipartFile.getOriginalFilename()).thenReturn("test.png");
        when(mediaUploadService.upload(any())).thenReturn(
                new MediaUploadResult("https://res.cloudinary.com/demo/image/upload/test.jpg", "test.jpg", 1024L, "image/jpeg")
        );
        when(mediaUploadService.isImage("image/jpeg")).thenReturn(true);

        FileUploadResponse response = fileStorageService.store(multipartFile);

        assertEquals("https://res.cloudinary.com/demo/image/upload/test.jpg", response.getMediaUrl());
        assertEquals("test.jpg", response.getMediaFilename());
        assertEquals(1024L, response.getMediaSizeBytes());
        assertEquals(MessageType.IMAGE, response.getMessageType());
    }

    @Test
    void store_VideoSuccess() throws Exception {
        when(mediaUploadService.upload(any())).thenReturn(
                new MediaUploadResult("https://res.cloudinary.com/demo/video/upload/test.mp4", "test.mp4", 1024L, "video/mp4")
        );
        when(mediaUploadService.isImage("video/mp4")).thenReturn(false);
        when(mediaUploadService.isVideo("video/mp4")).thenReturn(true);

        FileUploadResponse response = fileStorageService.store("test".getBytes(), "test.mp4", "video/mp4");

        assertEquals(MessageType.VIDEO, response.getMessageType());
    }

    @Test
    void store_AudioSuccess() throws Exception {
        when(mediaUploadService.upload(any())).thenReturn(
                new MediaUploadResult("https://res.cloudinary.com/demo/raw/upload/test.mp3", "test.mp3", 1024L, "audio/mpeg")
        );
        when(mediaUploadService.isImage("audio/mpeg")).thenReturn(false);
        when(mediaUploadService.isVideo("audio/mpeg")).thenReturn(false);
        when(mediaUploadService.isAudio("audio/mpeg")).thenReturn(true);

        FileUploadResponse response = fileStorageService.store("test".getBytes(), "test.mp3", "audio/mpeg");

        assertEquals(MessageType.AUDIO, response.getMessageType());
    }

    @Test
    void store_FileSuccess() throws Exception {
        when(mediaUploadService.upload(any())).thenReturn(
                new MediaUploadResult("https://res.cloudinary.com/demo/raw/upload/test.pdf", "test.pdf", 1024L, "application/pdf")
        );

        FileUploadResponse response = fileStorageService.store("test".getBytes(), "test.pdf", "application/pdf");

        assertEquals(MessageType.FILE, response.getMessageType());
    }
}
