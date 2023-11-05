import { Calculator } from "langchain/tools/calculator";
import { ReadFileTool, SerpAPI, Tool, WriteFileTool } from "langchain/tools";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PlanAndExecuteAgentExecutor } from "langchain/experimental/plan_and_execute";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { NodeFileStore } from "langchain/stores/file/node";
const store = new NodeFileStore("node-file-store/custom_agent");

// const model = new OpenAI({ temperature: 0 });
const embeddings = new OpenAIEmbeddings(
  process.env.AZURE_OPENAI_API_KEY
    ? { azureOpenAIApiDeploymentName: "Embeddings2" }
    : {}
);
const tools = [
  new Calculator(),
  new SerpAPI(),
  new ReadFileTool({ store }) as unknown as Tool,
  new WriteFileTool({ store }) as unknown as Tool,
];
const model = new ChatOpenAI({
  temperature: 0,
  modelName: "gpt-3.5-turbo",
  verbose: true,
});
const executor = PlanAndExecuteAgentExecutor.fromLLMAndTools({
  llm: model,
  tools,
});

const result = await executor.call({
  // input: `You need to create a nextJS project. NodeJS is installed on your computer. You have access to the following tools: search, calculator, read_file, write_file, web-browser.`,
  input: `
Find the current president of the USA and write an a txt file of 200 words and store it in a file called result.txt. To store the result in a variable, you can use the write_file tool with props "file_path" that is a name of file and "text" with your reply. 
You MUST USE EXACTLY the following json format to store the result as the following Examples: 

Human : "I need to use the write_file tool to write the name of the president to a file"
Assistant : 
"{
  "action": "write_file",
  "action_input": {
      "file_path": "result.txt",
      "text": "<Your answer here>"
  }}.
"

Human : "I need to read a file, how can I do that ?"
Assistant : 
"{
  "action": "read_file",
  "action_input": {
      "file_path": "result.txt",
  }}.
"
// End of examples

Now you can start !
`,
});

console.log({ result });
// Human : "I need to search for the current president of the USA"
// Assistant :