const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// تقديم ملفات الواجهة الأمامية (مثل index.html)
app.use(express.static('.'));

app.post('/api/chat', async (req, res) => {
  const { message, image, plan } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!message && !image) {
    return res.status(400).json({ reply: 'يرجى إدخال نص أو إرفاق صورة.' });
  }

  if (!apiKey) {
    return res.status(500).json({ reply: 'خطأ: لم يتم ضبط مفتاح GEMINI_API_KEY في Vercel.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `أنت مساعد OmniFix AI الذكي. الباقة الحالية للمستخدم هي: ${plan || 'الباقة العادية'}. أجب على كافة الأسئلة بدقة عالية واكتب الكود واشرحه وتحليل الصور عند إرفاقها.`
    });

    const contents = [];
    if (message) contents.push(message);

    if (image) {
      const base64Data = image.split(',')[1] || image;
      const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';
      contents.push({
        inlineData: { data: base64Data, mimeType: mimeType }
      });
    }

    const result = await model.generateContent(contents);
    const response = await result.response;

    return res.status(200).json({ reply: response.text() || 'لم يتم استلام رد.' });
  } catch (error) {
    return res.status(500).json({ reply: 'خطأ بالسيرفر: ' + (error.message || 'خطأ غير معروف') });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
