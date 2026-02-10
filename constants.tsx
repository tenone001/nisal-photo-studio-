
import { EditMode, ToolConfig, AspectRatio } from './types';

export const ASPECT_RATIOS: { label: string; value: AspectRatio }[] = [
  { label: '1:1 Square', value: '1:1' },
  { label: '4:3 Standard', value: '4:3' },
  { label: '16:9 Wide', value: '16:9' },
  { label: '9:16 Story', value: '9:16' },
];

export const BEAUTY_PRESETS = {
  Lips: [
    { label: 'Classic Matte Red', prompt: 'Apply a bold classic matte red lipstick.' },
    { label: 'Nude Pink', prompt: 'Apply a natural nude pink lipstick.' },
    { label: 'Glossy Peach', prompt: 'Apply a juicy glossy peach lip color.' },
    { label: 'Deep Burgundy / Wine', prompt: 'Apply a sophisticated deep burgundy wine-colored lipstick.' },
    { label: 'Soft Coral', prompt: 'Apply a fresh and soft coral lip tint.' },
    { label: 'Berry Pink', prompt: 'Apply a vibrant berry pink lipstick.' },
    { label: 'Mauve', prompt: 'Apply a trendy mauve muted purple lip color.' },
    { label: 'Clear Lip Gloss', prompt: 'Apply a high-shine clear lip gloss for a wet look.' },
    { label: 'Chocolate Brown', prompt: 'Apply a rich chocolate brown lipstick.' },
    { label: 'Gradient / Ombre Lips', prompt: 'Apply a gradient ombre lip effect, darker in the center and fading outwards.' }
  ],
  "Eye Shadow": [
    { label: 'Smokey Eye', prompt: 'Apply a dramatic smokey eye shadow using charcoal and black tones.' },
    { label: 'Rose Gold', prompt: 'Apply a shimmering rose gold eye shadow for a romantic look.' },
    { label: 'Natural Matte', prompt: 'Apply soft neutral matte eye shadow tones for a natural finish.' },
    { label: 'Sunset Blend', prompt: 'Apply a vibrant sunset eye shadow blend of orange, pink, and gold.' },
    { label: 'Emerald Sparkle', prompt: 'Apply a rich emerald green eye shadow with a metallic sparkle.' },
    { label: 'Midnight Blue', prompt: 'Apply a deep midnight blue eye shadow with subtle shimmer.' },
    { label: 'Soft Lavender', prompt: 'Apply a delicate pastel lavender eye shadow.' },
    { label: 'Champagne Glow', prompt: 'Apply a luminous champagne eye shadow highlight.' },
    { label: 'Bronze Metallic', prompt: 'Apply a warm bronze metallic eye shadow.' },
    { label: 'Electric Purple', prompt: 'Apply a bold and bright electric purple eye shadow.' }
  ],
  Hair: [
    { label: 'Platinum Blonde', prompt: 'Change hair color to a bold platinum silver blonde.' },
    { label: 'Caramel Balayage', prompt: 'Apply a caramel balayage effect with warm brown roots and honey-blonde highlights.' },
    { label: 'Honey Brown', prompt: 'Change hair color to a warm honey brown with subtle dimension.' },
    { label: 'Midnight Black', prompt: 'Change hair color to a sleek, glossy jet black.' },
    { label: 'Rose Gold', prompt: 'Change hair color to a trendy and soft rose gold tint.' },
    { label: 'Silver Ash', prompt: 'Change hair color to a modern cool-toned ash silver.' },
    { label: 'Deep Burgundy', prompt: 'Change hair color to a sophisticated deep burgundy or wine red.' },
    { label: 'Pastel Lavender', prompt: 'Change hair color to a soft pastel lavender purple.' },
    { label: 'Emerald Green', prompt: 'Change hair color to a bold and vibrant emerald green.' },
    { label: 'Auburn Red', prompt: 'Change hair color to a natural-looking rich auburn red.' }
  ],
  Nails: [
    { label: 'Dark Red', prompt: 'Apply a dark red or deep maroon nail polish with a glossy finish.' },
    { label: 'Glossy Pink', prompt: 'Apply a vibrant glossy pink nail polish.' },
    { label: 'Glitter Red', prompt: 'Apply a sparkly glitter red nail polish effect.' },
    { label: 'Matte Black', prompt: 'Apply a sleek matte black nail polish.' },
    { label: 'French Manicure', prompt: 'Apply a classic French manicure with white tips and a natural base.' },
    { label: 'Chrome Silver', prompt: 'Apply a futuristic chrome or metallic silver nail polish effect.' },
    { label: 'Nude / Beige', prompt: 'Apply a clean nude or beige nail polish.' },
    { label: 'Ombre Style', prompt: 'Apply an ombre style nail polish effect with a smooth color transition.' },
    { label: 'Marble Effect', prompt: 'Apply a sophisticated marble effect nail art pattern.' },
    { label: 'Pastel Lavender', prompt: 'Apply a soft pastel lavender or mint green nail polish.' }
  ],
  Piercing: [
    { label: 'Classic Nose Stud', prompt: 'Add a small, elegant silver nose stud on the nostril.' },
    { label: 'Silver Septum Ring', prompt: 'Add a sleek silver circular barbell septum ring.' },
    { label: 'Eyebrow Hoop', prompt: 'Add a small silver hoop piercing to the outer eyebrow.' },
    { label: 'Labret Stud', prompt: 'Add a minimalist silver labret stud below the center of the lower lip.' },
    { label: 'Medusa Piercing', prompt: 'Add a small sparkling stud piercing in the philtrum area above the upper lip.' },
    { label: 'Monroe Piercing', prompt: 'Add a classic silver stud piercing on the upper left side above the lip.' },
    { label: 'Bridge Piercing', prompt: 'Add a silver barbell bridge piercing between the eyes at the top of the nose.' },
    { label: 'Double Nostril', prompt: 'Add two symmetrical silver studs on both nostrils.' },
    { label: 'Vertical Labret', prompt: 'Add a silver vertical labret piercing through the center of the lower lip.' },
    { label: 'Snake Bites', prompt: 'Add two symmetrical silver hoop piercings on the outer edges of the lower lip.' }
  ]
};

const QUALITY_PRESERVATION = "\nFIDELITY RULE: Maintain the maximum possible resolution and sharpness. Do not introduce blur, noise, or artifacts. Keep untouched areas of the photo identical to the source in quality.";
const NO_BORDER_INSTRUCTION = "\nLAYOUT RULE: Your output must NOT contain any black borders, letterboxing, or padding. Fill the entire canvas area.";

const SHARED_RULES = `${QUALITY_PRESERVATION}${NO_BORDER_INSTRUCTION}`;

export const TOOLS: ToolConfig[] = [
  {
    id: EditMode.EXPAND,
    name: 'Generative Expand',
    icon: 'fa-expand',
    placeholder: 'Describe what to add in the new areas...',
    description: 'Outpaint and extend the canvas.',
    systemPrompt: `Act as a professional outpainting specialist. Analyze the image and seamlessly extend its borders. Generate new content for expanded areas that perfectly matches existing textures and lighting.${SHARED_RULES}`
  },
  {
    id: EditMode.ADD_OBJECT,
    name: 'Add New Object',
    icon: 'fa-circle-plus',
    placeholder: 'What should we add? (e.g., "A vintage sports car")...',
    description: 'Brush an area and describe what to place there.',
    systemPrompt: `Act as an object synthesis specialist. The user has highlighted a specific area with a bright red brush. Integrate the described object into that exact area. IMPORTANT: Keep the rest of the image (outside the red area) absolutely unchanged in quality and detail.${SHARED_RULES}`
  },
  {
    id: EditMode.REMOVE,
    name: 'Remove Object',
    icon: 'fa-eraser',
    placeholder: 'Optional: Describe the object...',
    description: 'Brush over the object to erase it.',
    systemPrompt: `Act as an object removal specialist. Erase areas covered by the red brush and reconstruct the background realistically. IMPORTANT: Do not degrade the quality of the surrounding, non-red areas. Use surrounding high-res textures for the fill.${SHARED_RULES}`
  },
  {
    id: EditMode.COMPOSER,
    name: 'Scene Composer',
    icon: 'fa-layer-group',
    placeholder: 'Describe how to combine the photos (e.g., "Place the person from image 2 into the landscape of image 1")...',
    description: 'Combine multiple photos into one single composition.',
    systemPrompt: `Act as a master photo compositor. You are provided with multiple images. Image 1 is the base canvas. Images 2, 3, etc., are reference assets. Your goal is to combine elements from the reference assets into the base canvas as described by the user. Match lighting, shadows, perspective, and depth of field perfectly to ensure a hyper-realistic result.${SHARED_RULES}`
  },
  {
    id: EditMode.FACE_SWAP,
    name: 'Face Swap',
    icon: 'fa-user-astronaut',
    placeholder: 'Optional instructions (e.g. "Match lighting")...',
    description: '1. Upload source face. 2. Brush over the face on canvas you want to swap.',
    systemPrompt: `Act as a master digital face-replacement specialist. You are provided with two images: 1. A Target Canvas (main image) with a red brush area indicating the face to be replaced. 2. A Source Face. Replace the area covered by the red brush in the Target Canvas with the facial features from the Source Face image. Match the lighting, skin texture, and perspective of the Target Canvas perfectly. The final output must look like a real, unedited photo.${SHARED_RULES}`
  },
  {
    id: EditMode.BACKGROUND,
    name: 'Background',
    icon: 'fa-image',
    placeholder: 'Change background to...',
    description: 'Swap or blur the background.',
    systemPrompt: `Act as a background manipulation specialist. Precisely isolate the subject. Replace the background while keeping the subject at its original high-definition resolution and sharpness.${SHARED_RULES}`
  },
  {
    id: EditMode.CUSTOM,
    name: 'Custom Edit',
    icon: 'fa-pen-nib',
    placeholder: 'Describe your creative vision...',
    description: 'Full creative control.',
    systemPrompt: `Act as a master photo editor. Execute the following complex manipulation while maintaining maximum realism and source image fidelity.${SHARED_RULES}`
  },
  {
    id: EditMode.BEAUTY,
    name: 'Beauty & Retouch',
    icon: 'fa-face-smile',
    placeholder: 'Describe beauty changes or select a preset below...',
    description: 'Enhance facial features, eye makeup, hair color, or apply virtual nails and piercings.',
    systemPrompt: `Act as a high-end celebrity makeup artist and digital retoucher. The user has highlighted a specific area (like lips, eyes, hair, nails, or skin for piercings) with a red brush. Apply the requested beauty enhancement, eye shadow, nail art, piercing, or color change ONLY to that area. Ensure the changes look natural, professionally applied, and high-resolution.${SHARED_RULES}`
  }
];
