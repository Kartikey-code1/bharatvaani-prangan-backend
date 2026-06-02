import axios from "axios";

const rewriteArticle = async (prompt) => {

  try {

    const response = await axios.post(

      "https://openrouter.ai/api/v1/chat/completions",

      {

        model: "openai/gpt-4o-mini",

        messages: [

          {
            role: "system",
            content:
              "You are a professional Hindi news writer. Write clean, detailed and human-like Hindi news articles."
          },

          {
            role: "user",
            content: prompt
          }

        ],

        temperature: 0.7,
        max_tokens: 1000

      },

      {

        headers: {

          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,

          "Content-Type": "application/json",

          "HTTP-Referer": "http://localhost:5173",

          "X-Title": "Bharatvaani Prangan"

        }

      }

    );

    return response.data.choices[0].message.content;

  } catch (err) {

    console.log(
      "OPENROUTER ERROR:",
      err.response?.data || err.message
    );

    return "News unavailable";

  }

};

export { rewriteArticle };