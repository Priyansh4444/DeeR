import { createClient } from "@deepgram/sdk";

const listen = async () => {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  const url =
    "https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav";
  const deepgram = createClient(deepgramApiKey);

  const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
    { url },
    {
      model: "nova-2",
      language: "en",
      smart_format: true,
      punctuate: true,
      utterances: true,
      filler_words: true,
    }
  );

  if (error) {
    console.error(error);
  } else {
    console.dir(result, { depth: null });
  }
};

listen();
