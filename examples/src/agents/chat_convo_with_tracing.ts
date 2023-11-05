import { ChatOpenAI } from "langchain/chat_models/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { SerpAPI, Tool, WriteFileTool } from "langchain/tools";
import { Calculator } from "langchain/tools/calculator";
import { InMemoryFileStore } from "langchain/stores/file/in_memory";
import { NodeFileStore } from "langchain/stores/file/node";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { WebBrowser } from "langchain/tools/webbrowser";

// const store = new InMemoryFileStore();
const store = new NodeFileStore('node-file-store');

export const run = async () => {
  process.env.LANGCHAIN_HANDLER = "langchain";
  const model = new ChatOpenAI({ temperature: 0 });
  const embeddings = new OpenAIEmbeddings(
    process.env.AZURE_OPENAI_API_KEY
      ? { azureOpenAIApiDeploymentName: "Embeddings2" }
      : {}
  );

  // const browser = new WebBrowser({ model, embeddings });

  const tools = [
    new SerpAPI(process.env.SERPAPI_API_KEY, {
      location: "Paris, France",
      hl: "fr",
      gl: "fr",
    }),
    new Calculator(),
    new WriteFileTool({ store }) as unknown as Tool,
    new WebBrowser({ model, embeddings })
  ];

  // Passing "chat-conversational-react-description" as the agent type
  // automatically creates and uses BufferMemory with the executor.
  // If you would like to override this, you can pass in a custom
  // memory option, but the memoryKey set on it must be "chat_history".
  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "chat-conversational-react-description",
    verbose: true,
  });
  console.log("Loaded agent.");

  // const input0 = "Your final objective is to output a file containing the reply to the next query. Please confirm you understood.";

  // const result0 = await executor.call({ input: input0 });

  // console.log(`Got output ${result0.output}`);
  // site:https://metar-taf.com

  // const input1 = "Use the SERP Tool to do a search query on google for 'metar report in LFPL, lognes france' ? and return only the 3 firsts result.";
  const input1 = "Reply to the following search query : What is the current metar report in LFPL, lognes france site:https://metar-taf.com ? DO NOT RETURN THE RESULTS. Return only the links to the most ranked sources.";

  const result1 = await executor.call({ input: input1 });

  console.log(`Got output ${result1.output}`);

  const input2 = `${result1.output  }. Pick the best option and visit the website and reply to the following question : What is the current metar report in LFPL ? Write the raw METAR and generate a summary of the METAR in less than 140 words. Additionnaly reply to the following question in one sentence: Is it possible to fly VFR with these METAR conditions ? `;

  const result2 = await executor.call({ input: input2 });

  console.log(`Got output ${result2.output}`);

  const input3 = `write the result in a file called test.txt. Return the result as a json object like containing file_path and text. {file_path: 'test.txt', text: '${  result2.output  }'}`;

  const result3 = await executor.call({ input: input3 });

  console.log(`Got output ${result3.output}`);
};
