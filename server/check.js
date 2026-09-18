require('dotenv').config();

async function checkModels() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  
  console.log("=== YOUR AVAILABLE MODELS ===");
  data.models.forEach(m => {
    if (m.supportedGenerationMethods.includes('generateContent')) {
      console.log(m.name);
    }
  });
}

checkModels();