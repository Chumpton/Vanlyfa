filepath = r"c:\Users\campw\Desktop\Vanlyfa-Stable1\Vanlyfa-main - Copy\logic.js"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target_start = "function handleProfilePhotoUpload(e) {"
target_end = """    showToast("Profile photo loaded! Click Save to apply.", "success");
  };
  reader.readAsDataURL(file);
}"""

start_idx = content.find(target_start)
end_idx = content.find(target_end)

if start_idx == -1 or end_idx == -1:
    print("Error: handleProfilePhotoUpload boundaries not found in logic.js")
    exit(1)

# Include target_end in replaced section
end_idx += len(target_end)

replacement = """let cropState = {
  img: null,
  zoom: 1.0,
  x: 100,
  y: 100,
  isDragging: false,
  dragStart: { x: 0, y: 0 }
};

function drawCropImage(canvas, drawBorder = true) {
  const ctx = canvas.getContext('2d');
  const img = cropState.img;
  if (!img) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  // Clip to circle circular viewport
  ctx.beginPath();
  ctx.arc(100, 100, 100, 0, Math.PI * 2);
  ctx.clip();
  
  // Scale factor to make image fit
  const scale = Math.max(200 / img.width, 200 / img.height) * cropState.zoom;
  const w = img.width * scale;
  const h = img.height * scale;
  
  ctx.drawImage(img, cropState.x - w / 2, cropState.y - h / 2, w, h);
  ctx.restore();
  
  if (drawBorder) {
    ctx.beginPath();
    ctx.arc(100, 100, 99, 0, Math.PI * 2);
    ctx.strokeStyle = '#3B7A57';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function initCropHandlers(canvas, zoomInput) {
  if (canvas._hasCropHandlers) return;
  canvas._hasCropHandlers = true;
  
  const onStart = (e) => {
    cropState.isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    cropState.dragStart = { x: clientX - cropState.x, y: clientY - cropState.y };
  };
  
  const onMove = (e) => {
    if (!cropState.isDragging) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    cropState.x = clientX - cropState.dragStart.x;
    cropState.y = clientY - cropState.dragStart.y;
    drawCropImage(canvas);
  };
  
  const onEnd = () => {
    cropState.isDragging = false;
  };
  
  canvas.addEventListener('mousedown', onStart);
  canvas.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  
  canvas.addEventListener('touchstart', onStart, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onEnd);
  
  zoomInput.addEventListener('input', (e) => {
    cropState.zoom = parseFloat(e.target.value);
    drawCropImage(canvas);
  });
}

function handleProfilePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    const workspace = document.getElementById('avatar-crop-workspace');
    if (!workspace) return;
    
    workspace.style.display = 'flex';
    const canvas = document.getElementById('avatar-crop-canvas');
    const zoomInput = document.getElementById('avatar-crop-zoom');
    
    cropState.img = new Image();
    cropState.img.onload = function() {
      cropState.zoom = 1.0;
      cropState.x = 100;
      cropState.y = 100;
      zoomInput.value = 1.0;
      
      initCropHandlers(canvas, zoomInput);
      drawCropImage(canvas);
      
      const statusSpan = document.getElementById('profile-photo-upload-status');
      if (statusSpan) statusSpan.innerText = "Position and zoom your photo below.";
      showToast("Reposition and zoom your avatar inside the preview circle!", "info");
    };
    cropState.img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}"""

content = content[:start_idx] + replacement + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("logic.js handleProfilePhotoUpload updated successfully!")
