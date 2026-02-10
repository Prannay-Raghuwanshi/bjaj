import express from "express";


import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(express.json());

const EMAIL = process.env.OFFICIAL_EMAIL;

// ---------- Utility Functions ----------

function errorResponse(res, status, message) {
  return res.status(status).json({
    is_success: false,
    official_email: EMAIL,
    error: message
  });
}

function extractGeminiError(err) {
  const status = err?.response?.status;
  const apiMessage =
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    "Unknown error";
  return { status, apiMessage, raw: err?.response?.data };
}

async function geminiGenerateOneWordAnswer(question) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const e = new Error("GEMINI_API_KEY is missing");
    e.code = "MISSING_GEMINI_API_KEY";
    throw e;
  }

  // Try newer/common models first; fallback for accounts that don’t have access to some models.
  const modelsToTry = [
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ].filter(Boolean);

  let lastErr;
  for (const model of modelsToTry) {
    try {
      const aiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Answer the following question in EXACTLY ONE WORD.
Do not add punctuation.
Do not add explanation.
If unsure, still respond with one word only.

Question: ${question}`
                }
              ]
            }
          ]
        },
        {
          params: { key: apiKey },
          timeout: 20000
        }
      );

      const raw =
        aiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "Unknown";

      const cleaned = raw
        .trim()
        .replace(/[^A-Za-z0-9]/g, "")
        .split(/\s+/)[0];

      return cleaned || "Unknown";
    } catch (err) {
      lastErr = err;
      // Keep trying on model-not-found or permission errors; otherwise it’s likely request/key/quota.
      const { status } = extractGeminiError(err);
      if (![400, 401, 403, 404, 429].includes(status)) {
        throw err;
      }
    }
  }

  throw lastErr || new Error("Gemini request failed");
}




                            function gcd(a, b) {
                            while (b !== 0) {
                                [a, b] = [b, a % b];
                            }
                            return Math.abs(a);
                            }


function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

// This is the health -- GET/HEATH ENPOINT......

app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL
  });
});

// THIS IS THE POST / bfhl enpoint which iss suppsoed to handle the keys........
 

app.post("/bfhl", async (req, res) => {
  try {
          const keys =   Object.keys(req.body);

    //ye hai 1 key...
    if (keys.length !== 1) {
      return errorResponse(res, 400, "Exactly one input is required");
    }

    const key =   keys[0];
    const value = req.body[key];

            let data;


    switch (key) {
      case "fibonacci":
                        if (!Number.isInteger(value) || value < 0) {
                    return errorResponse(res, 400, "Invalid fibonacci input");
                    }
        data = [];


        for (let i = 0; i < value; i++) {
                        if (i === 0) data.push(0);
                        else if (i === 1) data.push(1);
                        else data.push(data[i - 1] + data[i - 2]);
        }
        break;

      case "prime":
                    if (!Array.isArray(value)) {
                    return errorResponse(res, 400, "Prime input must be an array");
                    }
        data = value.filter(n => {



          if (!Number.isInteger(n) || n < 2) return false;



          for (let i = 2; i * i <= n; i++) {
            if (n % i === 0) return false;
          }



          return true;
        });
        break;




      case "lcm":

        if (!Array.isArray(value) || value.length === 0) {


          return errorResponse(res, 400, "LCM input must be non empty....");
        }



        data = value.reduce((acc, n) => {
                            if (!Number.isInteger(n)) throw new Error("the number is invalid.....");
                            return lcm(acc, n);
        });
        break;

                     case "hcf":
                        if (!Array.isArray(value) || value.length === 0) {
                        return errorResponse(res, 400, "HCF input must be a non empty array.../..");
                        }





        data = value.reduce((acc, n) => {
          if (!Number.isInteger(n)) throw new Error("The number is Invaid....");
          return gcd(acc, n);
        });
        break;



      case "AI":
        if (typeof value !== "string" || value.trim() === "") {
          return errorResponse(res, 400, "AI input must be a string");
        }

        try {
          data = await geminiGenerateOneWordAnswer(value);
        } catch (err) {
          const { status, apiMessage, raw } = extractGeminiError(err);
          console.log("Gemini call failed:", { status, apiMessage });
          if (raw) console.log("Gemini error response:", JSON.stringify(raw, null, 2));
          // Return actionable error so Postman shows exactly what to fix (key/quota/model/etc).
          return errorResponse(
            res,
            502,
            `AI service failed${status ? ` (${status})` : ""}: ${apiMessage}`
          );
        }

        break;


      default:
        return errorResponse(res, 400, "Unsupported key");
    }




    return res.status(200).json({
      is_success: true,
      official_email: EMAIL,
      data
    });


  } catch (err) {
    console.log("Request not processing.. error: ", err.message);
    if (err.response?.data) {
      console.log("Gemini error response:", JSON.stringify(err.response.data, null, 2));
    }
    return errorResponse(res, 500, "There is problem in server");
  }
});

// ---------- Start Server ----------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on Port: ${PORT}`);
});