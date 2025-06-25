---
layout: default
title: Upload APIs
description: File and image upload endpoints for the idling.app API
---

# 📁 Upload APIs

This guide explains how to upload files and images using the idling.app API. Whether you're uploading profile pictures, post images, or custom emojis, this documentation covers everything you need to know.

## 🎯 What Are Upload APIs?

Upload APIs let you send files from your device to the server. Think of it like:
- **Email attachments** - you attach files to messages
- **Social media photos** - you upload pictures to share
- **Profile pictures** - you set an avatar image

Our upload system handles:
- **Image files** (JPG, PNG, WebP, GIF)
- **Size limits** (to keep the site running smoothly)
- **Security checks** (to prevent harmful files)
- **Automatic optimization** (to make images load faster)

## 📚 Available Endpoints

### POST /api/upload/image - Upload an Image

**What it does:** Upload an image file to the server

**Who can use it:** Logged-in users only

**File requirements:**
- **Allowed formats**: JPG, JPEG, PNG, WebP, GIF
- **Maximum size**: 5MB (can be configured)
- **Minimum size**: 1KB
- **Maximum dimensions**: 4096x4096 pixels

**How to use it:**

**Using HTML form:**
```html
<form action="/api/upload/image" method="POST" enctype="multipart/form-data">
  <input type="file" name="file" accept="image/*" required>
  <button type="submit">Upload Image</button>
</form>
```

**Using JavaScript:**
```javascript
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Upload successful:', result);
      return result;
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
}
```

**Using curl:**
```bash
curl -X POST https://yourdomain.com/api/upload/image \
  -F "file=@/path/to/your/image.jpg" \
  -H "Cookie: your-session-cookie"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "filename": "image-1234567890.jpg",
    "originalName": "my-photo.jpg",
    "size": 245760,
    "mimeType": "image/jpeg",
    "url": "/uploads/images/image-1234567890.jpg",
    "publicUrl": "https://yourdomain.com/uploads/images/image-1234567890.jpg",
    "dimensions": {
      "width": 1920,
      "height": 1080
    }
  },
  "metadata": {
    "uploadedAt": "2024-01-15T10:30:00Z",
    "uploadedBy": "user123",
    "fileHash": "abc123def456",
    "processed": true
  }
}
```

**What each field means:**
- **filename**: The name of the file on the server (unique)
- **originalName**: The original name of your file
- **size**: File size in bytes
- **mimeType**: The type of file (image/jpeg, image/png, etc.)
- **url**: Relative path to access the image
- **publicUrl**: Complete URL to view the image
- **dimensions**: Width and height of the image in pixels
- **uploadedAt**: When the file was uploaded
- **uploadedBy**: Which user uploaded it
- **fileHash**: Unique identifier for the file content
- **processed**: Whether the image has been optimized

**Error Responses:**

**401 Unauthorized:**
```json
{
  "error": "Authentication required",
  "message": "You must be logged in to upload files"
}
```

**400 Bad Request - No File:**
```json
{
  "error": "No file provided",
  "message": "Please select a file to upload"
}
```

**400 Bad Request - Invalid File Type:**
```json
{
  "error": "Invalid file type",
  "message": "Only image files (JPG, PNG, WebP, GIF) are allowed",
  "allowedTypes": ["image/jpeg", "image/png", "image/webp", "image/gif"]
}
```

**400 Bad Request - File Too Large:**
```json
{
  "error": "File too large",
  "message": "File size exceeds maximum limit of 5MB",
  "maxSize": 5242880,
  "receivedSize": 7340032
}
```

**500 Internal Server Error:**
```json
{
  "error": "Upload failed",
  "message": "Server error occurred during upload. Please try again."
}
```

## 🔧 How to Use Upload APIs

### 1. Simple File Upload with HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>Image Upload</title>
</head>
<body>
    <h1>Upload an Image</h1>
    
    <form id="uploadForm" enctype="multipart/form-data">
        <div>
            <label for="fileInput">Choose image:</label>
            <input type="file" id="fileInput" name="file" accept="image/*" required>
        </div>
        
        <div>
            <button type="submit">Upload Image</button>
        </div>
    </form>
    
    <div id="result"></div>
    
    <script>
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Please select a file');
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const response = await fetch('/api/upload/image', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    document.getElementById('result').innerHTML = `
                        <p>Upload successful!</p>
                        <img src="${result.file.url}" alt="Uploaded image" style="max-width: 300px;">
                        <p>File URL: <a href="${result.file.publicUrl}" target="_blank">${result.file.publicUrl}</a></p>
                    `;
                } else {
                    document.getElementById('result').innerHTML = `
                        <p style="color: red;">Upload failed: ${result.message}</p>
                    `;
                }
            } catch (error) {
                document.getElementById('result').innerHTML = `
                    <p style="color: red;">Error: ${error.message}</p>
                `;
            }
        });
    </script>
</body>
</html>
```

### 2. Advanced Upload with Progress

```javascript
async function uploadWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const xhr = new XMLHttpRequest();
    
    // Handle upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(Math.round(percentComplete));
      }
    });
    
    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });
    
    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });
    
    // Start upload
    xhr.open('POST', '/api/upload/image');
    xhr.send(formData);
  });
}

// Usage example
const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('progressBar');

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const result = await uploadWithProgress(file, (progress) => {
      progressBar.style.width = progress + '%';
      progressBar.textContent = progress + '%';
    });
    
    console.log('Upload complete:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
});
```

### 3. File Validation Before Upload

```javascript
function validateImage(file) {
  const errors = [];
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only JPG, PNG, WebP, and GIF images are allowed');
  }
  
  // Check file size (5MB = 5,242,880 bytes)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
  }
  
  // Check minimum size
  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    errors.push('File is too small');
  }
  
  return errors;
}

// Usage example
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const errors = validateImage(file);
  
  if (errors.length > 0) {
    alert('Upload errors:\n' + errors.join('\n'));
    event.target.value = ''; // Clear the input
    return;
  }
  
  // File is valid, proceed with upload
  uploadImage(file);
}
```

### 4. Image Preview Before Upload

```javascript
function previewImage(file, previewElement) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    previewElement.src = e.target.result;
    previewElement.style.display = 'block';
  };
  
  reader.readAsDataURL(file);
}

// Usage example
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('imagePreview');

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    previewImage(file, preview);
  }
});
```

## 🎨 Upload Features

### Automatic Image Optimization

When you upload an image, the server automatically:

1. **Compresses the image** to reduce file size
2. **Generates multiple sizes** for different uses:
   - **Thumbnail**: 150x150 pixels
   - **Medium**: 800x600 pixels
   - **Large**: Original size (up to 1920x1080)
3. **Converts to WebP** format when supported
4. **Strips metadata** for privacy and smaller file size

### Security Features

- **File type validation** - Only image files are accepted
- **Virus scanning** - Files are checked for malware
- **Size limits** - Prevents excessive storage usage
- **Rate limiting** - Prevents spam uploads
- **User authentication** - Only logged-in users can upload

### Storage Organization

Uploaded files are organized by:
- **Date**: Files are stored in folders by upload date
- **User**: Each user has their own subdirectory
- **Type**: Images are separated from other file types
- **Size**: Different image sizes are stored separately

Example file structure:
```
uploads/
├── images/
│   ├── 2024/
│   │   ├── 01/
│   │   │   ├── user123/
│   │   │   │   ├── image-1234567890.jpg
│   │   │   │   ├── image-1234567890-thumb.jpg
│   │   │   │   └── image-1234567890-medium.jpg
```

## 🚨 Common Issues and Solutions

### Upload Fails with "File Too Large"

**Problem:** Your image is bigger than the allowed limit.

**Solutions:**
1. **Compress the image** using online tools or photo editing software
2. **Resize the image** to smaller dimensions
3. **Change the format** - JPG files are usually smaller than PNG

**Example compression:**
```bash
# Using online tools
# 1. Go to tinypng.com or compressor.io
# 2. Upload your image
# 3. Download the compressed version

# Using command line (if you have ImageMagick)
convert large-image.jpg -quality 80 -resize 1920x1080 compressed-image.jpg
```

### Upload Fails with "Invalid File Type"

**Problem:** The file type is not supported.

**Solutions:**
1. **Convert the image** to a supported format (JPG, PNG, WebP, GIF)
2. **Check the file extension** - make sure it matches the actual file type
3. **Re-save the image** from a photo editor in the correct format

### Upload is Very Slow

**Problem:** Upload takes too long to complete.

**Solutions:**
1. **Check your internet connection**
2. **Compress the image** to reduce file size
3. **Try a different network** (mobile data vs WiFi)
4. **Upload during off-peak hours**

### Image Quality is Poor After Upload

**Problem:** The uploaded image looks worse than the original.

**Solutions:**
1. **Start with a higher quality original**
2. **Use JPG format** for photos (better compression)
3. **Use PNG format** for graphics with few colors
4. **Check the image dimensions** - very small images may look pixelated when displayed larger

## 💡 Best Practices

### For Developers

**File Validation:**
```javascript
// Always validate on both client and server side
function validateFile(file) {
  // Client-side validation for better UX
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }
  
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be smaller than 5MB');
  }
}
```

**Error Handling:**
```javascript
async function uploadImage(file) {
  try {
    validateFile(file);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }
    
    return await response.json();
  } catch (error) {
    // Handle error appropriately
    console.error('Upload error:', error);
    showErrorMessage(error.message);
    throw error;
  }
}
```

**Progress Feedback:**
```javascript
// Always show upload progress for large files
function showUploadProgress(percentComplete) {
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  progressBar.style.width = percentComplete + '%';
  progressText.textContent = `Uploading... ${percentComplete}%`;
  
  if (percentComplete === 100) {
    progressText.textContent = 'Processing...';
  }
}
```

### For Users

**Preparing Images:**
1. **Choose the right format:**
   - **JPG**: Best for photos with many colors
   - **PNG**: Best for graphics, logos, or images with transparency
   - **WebP**: Smallest file size, modern browsers only
   - **GIF**: Only for animations

2. **Optimize before uploading:**
   - Resize images to reasonable dimensions
   - Compress images to reduce file size
   - Remove unnecessary metadata

3. **Name your files clearly:**
   - Use descriptive names: `profile-picture.jpg` instead of `IMG_1234.jpg`
   - Avoid special characters and spaces
   - Keep names short but meaningful

**Upload Tips:**
1. **Check your connection** before uploading large files
2. **Don't close the browser** during upload
3. **Wait for confirmation** before leaving the page
4. **Keep backups** of important images

---

## 🔗 Related Documentation

- **[API Overview](./index)** - General API information and authentication
- **[Emoji APIs](./emojis)** - Using uploaded images as custom emojis
- **[User APIs](./user)** - Managing user profiles and avatars
- **[Environment Variables](../development/environment-variables)** - Configuring upload settings

---

## 📋 Quick Reference

### Upload Limits
- **Maximum file size**: 5MB
- **Allowed formats**: JPG, PNG, WebP, GIF
- **Maximum dimensions**: 4096x4096 pixels
- **Minimum file size**: 1KB

### Response Fields
- `filename` - Server-generated unique filename
- `url` - Relative path to the uploaded file
- `publicUrl` - Complete URL to access the file
- `size` - File size in bytes
- `dimensions` - Image width and height

### Common Status Codes
- **200** - Upload successful
- **400** - Bad request (invalid file, too large, etc.)
- **401** - Not logged in
- **500** - Server error

---

*File uploads are an essential part of any social platform. Our upload system is designed to be fast, secure, and user-friendly while maintaining high quality standards.* 