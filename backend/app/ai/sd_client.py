import os
import asyncio
from datetime import datetime
from typing import Optional, List, Dict
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from huggingface_hub.errors import HfHubHTTPError, InferenceTimeoutError

load_dotenv()


class SDClient:
    """Client for image generation via Hugging Face Inference Providers.

    NOTE on the old code: it pointed at `api-inference.huggingface.co`,
    which is the legacy "Serverless Inference API" host. HF has moved to
    a unified router at `router.huggingface.co`, and the official
    `huggingface_hub` client handles that routing (and provider
    selection) for you. That's almost certainly the source of the DNS
    errors you were seeing.
    """

    def __init__(self):
        self.api_key = os.getenv("HF_API_KEY") or os.getenv("HF_TOKEN")

        if not self.api_key:
            print("⚠️ WARNING: HF_API_KEY / HF_TOKEN not found in environment variables")

        # ✅ Models that are actually served for text-to-image via
        # Inference Providers right now. runwayml/stable-diffusion-v1-5
        # is gone (repo was taken down) and hf-inference no longer
        # serves big diffusion models on the free tier — image models
        # are routed to providers like fal-ai / replicate instead.
        self.models = [
            "black-forest-labs/FLUX.1-schnell",  # fast, free-tier friendly, great default
            "stabilityai/stable-diffusion-2-1",
            "black-forest-labs/FLUX.1-dev",       # higher quality, slower/pricier
        ]

        # provider="auto" lets HF pick the best available provider for
        # the chosen model (fal-ai, replicate, together, etc.) instead
        # of you hardcoding a dead host.
        self.client = InferenceClient(api_key=self.api_key, provider="auto") if self.api_key else None

    async def generate_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        width: int = 512,
        height: int = 512,
        num_inference_steps: int = 30,
    ) -> Optional[str]:
        if not self.client:
            return None

        for model in self.models:
            try:
                print(f"🔍 Trying model: {model}")

                # huggingface_hub's client is sync, so run it in a thread
                # to keep this function usable from async code.
                image = await asyncio.to_thread(
                    self.client.text_to_image,
                    prompt,
                    model=model,
                    negative_prompt=negative_prompt
                    or "painting, drawing, illustration, anime, cartoon, ugly",
                    width=width,
                    height=height,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=7.5,
                )

                upload_dir = "static/uploads/images"
                os.makedirs(upload_dir, exist_ok=True)

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"sd_{timestamp}.png"
                filepath = os.path.join(upload_dir, filename)

                image.save(filepath)  # PIL.Image

                print(f"✅ Image generated with {model}")
                return f"/uploads/{filename}"

            except InferenceTimeoutError:
                # Model is cold-starting; genuinely wait, then retry the
                # SAME model (the old code's `continue` skipped this and
                # jumped straight to the next model in the list).
                print(f"⏳ {model} timed out / is loading, retrying once...")
                try:
                    await asyncio.sleep(15)
                    image = await asyncio.to_thread(
                        self.client.text_to_image,
                        prompt,
                        model=model,
                        negative_prompt=negative_prompt,
                        width=width,
                        height=height,
                        num_inference_steps=num_inference_steps,
                        guidance_scale=7.5,
                    )
                    upload_dir = "static/uploads/images"
                    os.makedirs(upload_dir, exist_ok=True)
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"sd_{timestamp}.png"
                    filepath = os.path.join(upload_dir, filename)
                    image.save(filepath)
                    print(f"✅ Image generated with {model} (after retry)")
                    return f"/uploads/{filename}"
                except Exception as e:
                    print(f"❌ Retry failed for {model}: {e}")
                    continue

            except HfHubHTTPError as e:
                print(f"❌ HTTP error with {model}: {e}")
                continue

            except Exception as e:
                print(f"❌ Error with {model}: {e}")
                continue

        return None
    
    # File: backend/app/ai/sd_client.py

    async def generate_image_data(
        self,
        prompt: str,
        title: str,
        description: str,
        psychological_concept: str = "",
        analysis_context: str = "",
        width: int = 512,
        height: int = 512
    ) -> Dict[str, str]:
        """Generate image and return data with metadata"""
        
        image_url = await self.generate_image(
            prompt=prompt,
            width=width,
            height=height,
            num_inference_steps=30
        )
        
        if image_url:
            return {
                "url": image_url,
                "title": title,
                "description": description,
                "psychological_concept": psychological_concept,
                "analysis_context": analysis_context
            }
        else:
            # Fallback placeholder
            return {
                "url": self._get_placeholder_image(title),
                "title": title,
                "description": description,
                "psychological_concept": psychological_concept,
                "analysis_context": analysis_context
            }

    async def generate_images_for_page(
        self, subtopic: str, description: str, count: int = 2
    ) -> List[Dict[str, str]]:
        """Generate images with descriptive prompts."""

        prompts = [
            {
                "title": f"{subtopic} - View 1",
                "description": f"Image depicting {description}",
                "prompt": f"professional photograph, realistic, {description}, high quality, natural lighting, 8K, photorealistic",
            },
            {
                "title": f"{subtopic} - View 2",
                "description": f"Alternative view of {description}",
                "prompt": f"photorealistic image, {description}, natural colors, professional photography, emotional, cinematic, depth of field",
            },
        ]

        if count > 2:
            prompts.append(
                {
                    "title": f"{subtopic} - View 3",
                    "description": f"Another perspective of {description}",
                    "prompt": f"realistic photo, {description}, detailed background, natural lighting, professional, high resolution",
                }
            )

        images = []
        for prompt_data in prompts[:count]:
            image_url = await self.generate_image(
                prompt=prompt_data["prompt"], width=512, height=512, num_inference_steps=30
            )

            if image_url:
                images.append(
                    {
                        "url": image_url,
                        "title": prompt_data["title"],
                        "description": prompt_data["description"],
                    }
                )
            else:
                images.append(
                    {
                        "url": self._get_placeholder_image(subtopic),
                        "title": f"{subtopic} - Placeholder",
                        "description": f"Placeholder for {subtopic}",
                    }
                )

        return images

    def _get_placeholder_image(self, text: str) -> str:
        import urllib.parse

        encoded = urllib.parse.quote(text[:30])
        return f"https://via.placeholder.com/512x512/428475/FFF4E1?text={encoded}"