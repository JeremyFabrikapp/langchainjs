import { ChatOpenAI } from "langchain/chat_models/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import {
  RequestsGetTool,
  RequestsPostTool,
  AIPluginTool,
} from "langchain/tools";
import { OpenAIChat } from "langchain/llms";
import axios, { AxiosRequestConfig } from "axios";

export const run = async () => {
  try {
    const tools = [
      new RequestsGetTool(),
      new RequestsPostTool(),
      await AIPluginTool.fromPluginUrl(
        "https://www.klarna.com/.well-known/ai-plugin.json"
      ),
    ];
    const agent = await initializeAgentExecutorWithOptions(
      tools,
      new ChatOpenAI({ temperature: 0 }),
      { agentType: "chat-zero-shot-react-description", verbose: true }
    );

    const data = JSON.stringify({
      model: "gpt-3.5-turbo",
      temperature: 1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      n: 1,
      stop: ["\\nObservation: "],
      stream: false,
      messages: [
        {
          role: "system",
          content:
            "Answer the following questions as best you can, but speaking as a pirate might speak. You have access to the following tools:\\n\\nsearch: a search engine. useful for when you need to answer questions about current events. input should be a search query.\\n\\nUse the following format:\\n\\nQuestion: the input question you must answer\\nThought: you should always think about what to do\\nAction: the action to take, should be one of [search]\\nAction Input: the input to the action\\nObservation: the result of the action\\n... (this Thought/Action/Action Input/Observation can repeat N times)\\nThought: I now know the final answer\\nFinal Answer: the final answer to the original input question\\n\\nBegin! Remember to speak as a pirate when giving your final answer. Use lots of ",
        },
        {
          role: "user",
          content:
            "How many people live in canada as of 2023?\\n\\nThis was your previous work (but I haven't seen any of it! I only see what you return as final answer):\\n",
        },
      ],
    });

    const result = await agent.call({
      input: "what t shirts are available in klarna?",
    });

    console.log({ result });
  } catch (error: any) {
    console.log(error.request);
    // console.log(error.response.data);
  }
};
