import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.config import settings
from app.core.security import get_current_user_id

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_uid_str: str = Depends(get_current_user_id)
):
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image file type. Allowed: JPEG, PNG, WebP, GIF")

    # Generate unique asset filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_id = f"post-{current_uid_str}-{uuid.uuid4().hex[:8]}.{ext}"

    # Return upload confirmation & public access URL path
    return {
        "file_name": file_id,
        "content_type": file.content_type,
        "url": f"{settings.SUPABASE_URL}/storage/v1/object/public/post_images/{file_id}"
    }
