import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

interface FalImage {
  url: string;
  width: number;
  height: number;
  content_type: string;
}

interface FalResponse {
  data: {
    images: FalImage[];
    timings: Record<string, number>;
    seed: number;
    has_nsfw_concepts: boolean[];
    prompt: string;
  };
  requestId: string;
}

export async function POST(request: Request) {
  const { prompt } = await request.json();
  
  try {
    // Generate only 2 images at a time to reduce server load and improve response time
    const firstBatch = await Promise.all([1, 2].map(async () => {
      const result = await fal.subscribe(process.env.NEXT_PUBLIC_FAL_MODEL as string, {
        input: {
          prompt: prompt,
          aspect_ratio: "1:1",
          num_images: 1,
          seed: Math.floor(Math.random() * 1000000) // Add random seed for more variety
        }
      });

      const typedResult = result as unknown as FalResponse;
      if (!typedResult?.data?.images?.[0]?.url) {
        throw new Error('Invalid response from FAL.ai');
      }

      return typedResult.data.images[0].url;
    }));

    // Return the first batch immediately
    return Response.json({ 
      imageUrls: firstBatch,
      status: 'partial',
      message: 'First batch of images generated. More coming...'
    });
    
  } catch (error) {
    console.error('FAL.ai API error:', error);
    return Response.json(
      { 
        error: (error as Error).message,
        message: 'Failed to generate images. Please try again.'
      }, 
      { status: 500 }
    );
  }
} 