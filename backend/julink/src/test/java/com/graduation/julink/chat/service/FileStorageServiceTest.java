package com.graduation.julink.chat.service;

import com.graduation.julink.chat.ChatDTOs.FileUploadResponse;
import com.graduation.julink.chat.ChatEntities.MessageType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileStorageServiceTest {

    @InjectMocks
    private FileStorageService fileStorageService;

    @Mock
    private MultipartFile multipartFile;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(fileStorageService, "uploadDir", tempDir.toString());
        ReflectionTestUtils.setField(fileStorageService, "baseUrl", "http://localhost:8080");
    }

    @Test
    void store_EmptyFile_ThrowsException() {
        when(multipartFile.isEmpty()).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> fileStorageService.store(multipartFile));
        assertEquals("File must not be empty", exception.getMessage());
    }

    @Test
    void store_FileTooLarge_ThrowsException() {
        when(multipartFile.isEmpty()).thenReturn(false);
        when(multipartFile.getSize()).thenReturn(51L * 1024 * 1024); // 51 MB

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> fileStorageService.store(multipartFile));
        assertEquals("File exceeds maximum allowed size of 50 MB", exception.getMessage());
    }

    @Test
    void store_ImageSuccess() throws IOException {
        when(multipartFile.isEmpty()).thenReturn(false);
        when(multipartFile.getSize()).thenReturn(1024L);
        when(multipartFile.getContentType()).thenReturn("image/png");
        when(multipartFile.getOriginalFilename()).thenReturn("test.png");
        when(multipartFile.getInputStream()).thenReturn(new ByteArrayInputStream("test".getBytes()));

        FileUploadResponse response = fileStorageService.store(multipartFile);

        assertNotNull(response);
        assertTrue(response.getMediaUrl().startsWith("http://localhost:8080/uploads/chat/"));
        assertTrue(response.getMediaUrl().endsWith(".png"));
        assertEquals("test.png", response.getMediaFilename());
        assertEquals(1024L, response.getMediaSizeBytes());
        assertEquals(MessageType.IMAGE, response.getMessageType());
    }

    @Test
    void store_VideoSuccess() throws IOException {
        when(multipartFile.isEmpty()).thenReturn(false);
        when(multipartFile.getSize()).thenReturn(1024L);
        when(multipartFile.getContentType()).thenReturn("video/mp4");
        when(multipartFile.getOriginalFilename()).thenReturn("test.mp4");
        when(multipartFile.getInputStream()).thenReturn(new ByteArrayInputStream("test".getBytes()));

        FileUploadResponse response = fileStorageService.store(multipartFile);

        assertEquals(MessageType.VIDEO, response.getMessageType());
    }

    @Test
    void store_AudioSuccess() throws IOException {
        when(multipartFile.isEmpty()).thenReturn(false);
        when(multipartFile.getSize()).thenReturn(1024L);
        when(multipartFile.getContentType()).thenReturn("audio/mpeg");
        when(multipartFile.getOriginalFilename()).thenReturn("test.mp3");
        when(multipartFile.getInputStream()).thenReturn(new ByteArrayInputStream("test".getBytes()));

        FileUploadResponse response = fileStorageService.store(multipartFile);

        assertEquals(MessageType.AUDIO, response.getMessageType());
    }

    @Test
    void store_FileSuccess() throws IOException {
        when(multipartFile.isEmpty()).thenReturn(false);
        when(multipartFile.getSize()).thenReturn(1024L);
        when(multipartFile.getContentType()).thenReturn("application/pdf");
        when(multipartFile.getOriginalFilename()).thenReturn("test.pdf");
        when(multipartFile.getInputStream()).thenReturn(new ByteArrayInputStream("test".getBytes()));

        FileUploadResponse response = fileStorageService.store(multipartFile);

        assertEquals(MessageType.FILE, response.getMessageType());
    }
}
