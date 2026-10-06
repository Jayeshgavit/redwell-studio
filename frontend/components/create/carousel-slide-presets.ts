import type { CarouselStorySlideDefinition, CarouselStoryTextRole } from "@/types/editor";

export const CAROUSEL_DEFAULT_TEXT: Record<CarouselStoryTextRole, string> = {
  title: "Add a headline", subtitle: "Introduce your idea", body: "Explain the idea in your own words.",
  eyebrow: "YOUR LABEL", metadata: "Add a date or credit", location: "Add a place", quote: "A thought worth sharing.", cta: "Add a next step",
};

export const CAROUSEL_SLIDE_PRESETS: Array<{
  id: string; name: string; description: string; definition: CarouselStorySlideDefinition;
}> = [
  { id: "cover", name: "Cover", description: "A clear hook for your story.", definition:
    { id: "cover", type: "cover", layoutId: "statement", eyebrow: "YOUR STORY", title: "An idea worth sharing", body: "Give readers a reason to swipe." } },
  { id: "content", name: "Content", description: "One idea, explained well.", definition:
    { id: "content", type: "tip", layoutId: "reading", eyebrow: "THE IDEA", title: "Make one point", body: "Explain it in a few clear sentences. Add an example that makes the idea useful." } },
  { id: "photo", name: "Photo + note", description: "Let an image carry the moment.", definition:
    { id: "photo", type: "gallery", layoutId: "photo-note", eyebrow: "IN THE FRAME", title: "A moment to keep", body: "Tell us what the photograph cannot." } },
  { id: "quote", name: "Quote", description: "A pause in the sequence.", definition:
    { id: "quote", type: "quote", layoutId: "reading", eyebrow: "A THOUGHT", quote: "Write something worth sitting with.", body: "Add the source or your own reflection." } },
  { id: "comparison", name: "Comparison", description: "Two images, one clear takeaway.", definition:
    { id: "comparison", type: "before-after", layoutId: "comparison", eyebrow: "BEFORE / AFTER", title: "Show what changed", body: "Describe the starting point, the change, and why it matters." } },
  { id: "closing", name: "Closing / CTA", description: "Give the story a destination.", definition:
    { id: "closing", type: "cta", layoutId: "closing", eyebrow: "YOUR NEXT STEP", title: "Take the idea with you", body: "Leave readers with one useful action.", cta: "Save for later" } },
  { id: "number", name: "Number / stat", description: "One number with context and a source.", definition:
    { id: "number", type: "highlight", layoutId: "number-note", eyebrow: "IN NUMBERS", title: "01", subtitle: "One useful measure", body: "Explain what the number means. Replace it with your own verified figure.", metadata: "SOURCE / DATE" } },
  { id: "list", name: "Short list", description: "Three points with room to breathe.", definition:
    { id: "list", type: "list", layoutId: "checklist", eyebrow: "TAKE NOTE", title: "Keep it useful", body: "01  Your first point\n02  Your second point\n03  Your third point", metadata: "SAVE FOR LATER" } },
  { id: "step", name: "Step + evidence", description: "An action illustrated by a photograph.", definition:
    { id: "step", type: "tip", layoutId: "step-note", eyebrow: "STEP 01", title: "Start with one action", body: "Explain the step and use the image to show it in practice.", metadata: "EXAMPLE / CREDIT" } },
  { id: "feature", name: "Editorial feature", description: "A photograph beside a column of copy.", definition:
    { id: "feature", type: "introduction", layoutId: "feature-column", eyebrow: "IN FOCUS", title: "Look a little closer", body: "Introduce the subject, explain the context, and name the detail worth noticing.", metadata: "SUBJECT / CREDIT" } },
  { id: "gallery", name: "Captioned gallery", description: "A hero frame, two details, and a shared note.", definition:
    { id: "gallery", type: "gallery", layoutId: "gallery-caption", eyebrow: "COLLECTED FRAMES", title: "Three small moments", body: "Write the note that connects these photographs." } },
  { id: "wide", name: "Wide screen", description: "A panoramic pause with copy outside the image.", definition:
    { id: "wide", type: "highlight", layoutId: "wide-screen", eyebrow: "A MOMENT TO KEEP", title: "Stay with the view", body: "Add a short observation or a photo credit." } },
];

export function getCarouselSlideTitle(slide: { storyText?: Array<{ role: string; text: string }> }) {
  return slide.storyText?.find((item) => item.role === "title" || item.role === "quote")?.text.trim() || "Untitled slide";
}
