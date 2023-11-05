import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { NodeFileStore } from "langchain/stores/file/node";
import {
  JsonGetValueTool,
  ReadFileTool,
  SerpAPI,
  Tool,
  WriteFileTool,
} from "langchain/tools";
import { Calculator } from "langchain/tools/calculator";
import { WebBrowser } from "langchain/tools/webbrowser";

export const run = async () => {
  const store = new NodeFileStore("node-file-store/custom_agent");

  const model = new OpenAI({ temperature: 0 });
  const embeddings = new OpenAIEmbeddings(
    process.env.AZURE_OPENAI_API_KEY
      ? { azureOpenAIApiDeploymentName: "Embeddings2" }
      : {}
  );
  const tools = [
    new SerpAPI(process.env.SERPAPI_API_KEY, {
      location: "Austin,Texas,United States",
      hl: "en",
      gl: "us",
    }),
    new Calculator(),
    new ReadFileTool({ store }) as unknown as Tool,
    new WriteFileTool({ store }) as unknown as Tool,
    new WebBrowser({ model, embeddings }),
  ];

  const prefix = `Answer the following questions as best you can, but speaking as a pirate might speak. You have access to the following tools:`;
  const suffix = `Begin! Output the result as json.

Question: {input}
{agent_scratchpad}`;

  const createPromptArgs = {
    suffix,
    prefix,
    inputVariables: ["input", "agent_scratchpad"],
  };

  const prompt = ZeroShotAgent.createPrompt(tools, createPromptArgs);

  const llmChain = new LLMChain({ llm: model, prompt });
  const agent = new ZeroShotAgent({
    llmChain,
    allowedTools: [
      "search",
      "calculator",
      "read_file",
      "write_file",
      "web-browser",
    ],
  });
  const agentExecutor = AgentExecutor.fromAgentAndTools({ agent, tools });
  console.log("Loaded agent.");

//   Read the file test.txt using json format like this :
//  { "action": "read_file",
//   "action_input": {
//       "file_path": "test.txt",
//   }}
// }.
  const input = `

You need to create a step by step guide to answer the following question: How to create a nextjs app ?
Then answer the questions that are in the text file. 
TO ANSWER THE QUESTION, DO THE FOLLOWING:
Use search to find the answer to the question AND RETURN ONLY THE LINKS, NOT RESULTS.
Then use web-browser to extract the content of the browser using json format like this :
{ 
  "action": "web-browser",
  "action_input": "<url>, <question>",
}.
You can visit as much pages as you want as long as you need to answer the question. 
`;
// Once you have the answer, write it in a file called result.txt using json format like this :

// Then write a file called result.txt using json format like this :
//   {"action": "write_file",
//   "action_input": {
//       "file_path": "result.txt",
//       "text": "<Your answer here>"
//   }}
// Then confirm the file exists. Return the content as output.


  // Who is Olivia Wilde's boyfriend? What is his current age raised to the 0.23 power? Write a file result.txt with the result using a json object like containing file_path and text. {
  //   "action": "write_file",
  //   "action_input": {
  //       "file_path": "test.txt",
  //       "text": "<Your answer here>"
  //   }

  console.log(`Executing with input "${input}"...`);

  const result = await agentExecutor.call({ input });

  console.log(`Got output ${result.output}`);
};
