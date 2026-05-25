package com.graduation.julink.common.media;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaUploadService {

    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final Set<String> VIDEO_TYPES = Set.of("video/mp4", "video/quicktime", "video/webm");
    private static final Set<String> AUDIO_TYPES = Set.of("audio/mpeg", "audio/ogg", "audio/wav", "audio/aac", "audio/webm");
    private static final Set<String> FILE_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/octet-stream"
    );
    private static final long MAX_FILE_SIZE_BYTES = 50L * 1024 * 1024;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${cloudinary.cloud-name:deymoklbe}")
    private String cloudName;

    @Value("${cloudinary.upload-preset:julink_uploads}")
    private String uploadPreset;

    public MediaUploadResult upload(MediaUploadRequest request) throws IOException, InterruptedException {
        validate(request);

        String contentType = normalizeContentType(request.contentType());
        byte[] uploadBytes = request.bytes();
        String uploadContentType = contentType;
        String filename = normalizeFilename(request.filename(), contentType);

        if (isImage(contentType) && request.imageVariant() != ImageVariant.ORIGINAL && request.imageVariant() != ImageVariant.CHAT) {
            uploadBytes = normalizeImage(request.bytes(), request.imageVariant());
            uploadContentType = "image/jpeg";
            filename = replaceExtension(filename, ".jpg");
        } else if (isImage(contentType)) {
            uploadBytes = resizeImagePreservingRatio(request.bytes(), 1280);
            uploadContentType = "image/jpeg";
            filename = replaceExtension(filename, ".jpg");
        }

        String resourceType = resourceType(uploadContentType);
        String boundary = "----julink-" + UUID.randomUUID();
        byte[] body = multipartBody(boundary, uploadBytes, filename, uploadContentType);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.cloudinary.com/v1_1/" + cloudName + "/" + resourceType + "/upload"))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("Cloudinary upload failed: " + response.body());
        }

        JsonNode json = objectMapper.readTree(response.body());
        String secureUrl = json.path("secure_url").asText(null);
        if (secureUrl == null || secureUrl.isBlank()) {
            throw new IOException("Cloudinary upload response did not include secure_url");
        }

        return new MediaUploadResult(secureUrl, filename, (long) uploadBytes.length, uploadContentType);
    }

    public boolean isSupportedMediaType(String contentType) {
        String normalized = normalizeContentType(contentType);
        return IMAGE_TYPES.contains(normalized)
                || VIDEO_TYPES.contains(normalized)
                || AUDIO_TYPES.contains(normalized)
                || FILE_TYPES.contains(normalized);
    }

    public boolean isImage(String contentType) {
        return IMAGE_TYPES.contains(normalizeContentType(contentType));
    }

    public boolean isVideo(String contentType) {
        return VIDEO_TYPES.contains(normalizeContentType(contentType));
    }

    public boolean isAudio(String contentType) {
        return AUDIO_TYPES.contains(normalizeContentType(contentType));
    }

    private void validate(MediaUploadRequest request) {
        if (request == null || request.bytes() == null || request.bytes().length == 0) {
            throw new IllegalArgumentException("File bytes must not be empty");
        }
        if (request.bytes().length > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File exceeds maximum allowed size of 50 MB");
        }
        if (!isSupportedMediaType(request.contentType())) {
            throw new IllegalArgumentException("Unsupported media type: " + request.contentType());
        }
    }

    private byte[] normalizeImage(byte[] bytes, ImageVariant variant) throws IOException {
        BufferedImage source = ImageIO.read(new java.io.ByteArrayInputStream(bytes));
        if (source == null) {
            throw new IOException("Unsupported image bytes");
        }

        Ratio ratio = ratioFor(variant);
        BufferedImage cropped = cropToRatio(source, ratio.width(), ratio.height());
        int targetWidth = Math.min(ratio.targetWidth(), cropped.getWidth());
        int targetHeight = Math.max(1, Math.round(targetWidth * ratio.height() / ratio.width()));

        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = resized.createGraphics();
        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        graphics.drawImage(cropped, 0, 0, targetWidth, targetHeight, null);
        graphics.dispose();

        return writeJpeg(resized, 0.82f);
    }

    private byte[] resizeImagePreservingRatio(byte[] bytes, int maxWidth) throws IOException {
        BufferedImage source = ImageIO.read(new java.io.ByteArrayInputStream(bytes));
        if (source == null) {
            throw new IOException("Unsupported image bytes");
        }

        int targetWidth = Math.min(maxWidth, source.getWidth());
        int targetHeight = Math.max(1, Math.round(targetWidth * (source.getHeight() / (float) source.getWidth())));

        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = resized.createGraphics();
        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        graphics.dispose();

        return writeJpeg(resized, 0.82f);
    }

    private BufferedImage cropToRatio(BufferedImage source, float ratioWidth, float ratioHeight) {
        float targetRatio = ratioWidth / ratioHeight;
        int width = source.getWidth();
        int height = source.getHeight();
        int cropWidth = width;
        int cropHeight = Math.round(width / targetRatio);

        if (cropHeight > height) {
            cropHeight = height;
            cropWidth = Math.round(height * targetRatio);
        }

        int x = Math.max(0, (width - cropWidth) / 2);
        int y = Math.max(0, (height - cropHeight) / 2);
        return source.getSubimage(x, y, cropWidth, cropHeight);
    }

    private byte[] writeJpeg(BufferedImage image, float quality) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            throw new IOException("No JPEG writer available");
        }

        ImageWriter writer = writers.next();
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ImageOutputStream imageOutput = ImageIO.createImageOutputStream(output)) {
            writer.setOutput(imageOutput);
            ImageWriteParam params = writer.getDefaultWriteParam();
            params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            params.setCompressionQuality(quality);
            writer.write(null, new IIOImage(image, null, null), params);
        } finally {
            writer.dispose();
        }

        return output.toByteArray();
    }

    private Ratio ratioFor(ImageVariant variant) {
        return switch (variant) {
            case PROFILE -> new Ratio(1f, 1f, 512);
            case BANNER -> new Ratio(16f, 9f, 1600);
            case POST -> new Ratio(4f, 5f, 1080);
            case CHAT, ORIGINAL -> new Ratio(1f, 1f, 1280);
        };
    }

    private byte[] multipartBody(String boundary, byte[] fileBytes, String filename, String contentType) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        writePart(output, boundary, "upload_preset", uploadPreset);
        output.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Type: " + contentType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(fileBytes);
        output.write("\r\n".getBytes(StandardCharsets.UTF_8));
        output.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        return output.toByteArray();
    }

    private void writePart(ByteArrayOutputStream output, String boundary, String name, String value) throws IOException {
        output.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(value.getBytes(StandardCharsets.UTF_8));
        output.write("\r\n".getBytes(StandardCharsets.UTF_8));
    }

    private String normalizeContentType(String contentType) {
        return contentType == null ? "" : contentType.toLowerCase().trim();
    }

    private String resourceType(String contentType) {
        if (isImage(contentType)) return "image";
        if (isVideo(contentType) || isAudio(contentType)) return "video";
        return "raw";
    }

    private String normalizeFilename(String filename, String contentType) {
        if (filename != null && !filename.isBlank()) {
            return filename.trim();
        }
        return "julink-upload-" + UUID.randomUUID() + defaultExtension(contentType);
    }

    private String defaultExtension(String contentType) {
        return switch (normalizeContentType(contentType)) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            case "video/mp4" -> ".mp4";
            case "video/quicktime" -> ".mov";
            case "video/webm" -> ".webm";
            case "audio/mpeg" -> ".mp3";
            case "audio/ogg" -> ".ogg";
            case "audio/wav" -> ".wav";
            case "audio/aac" -> ".aac";
            case "audio/webm" -> ".webm";
            case "application/pdf" -> ".pdf";
            case "application/msword" -> ".doc";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx";
            default -> "";
        };
    }

    private String replaceExtension(String filename, String extension) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(0, dot) + extension : filename + extension;
    }

    private record Ratio(float width, float height, int targetWidth) {}

    public enum ImageVariant {
        PROFILE,
        BANNER,
        POST,
        CHAT,
        ORIGINAL
    }

    public record MediaUploadRequest(
            byte[] bytes,
            String filename,
            String contentType,
            ImageVariant imageVariant
    ) {
        public MediaUploadRequest {
            if (imageVariant == null) {
                imageVariant = ImageVariant.ORIGINAL;
            }
        }
    }

    public record MediaUploadResult(
            String url,
            String filename,
            Long sizeBytes,
            String contentType
    ) {}
}
