export function generateCode(language, size, overlap, strategy) {
  const recursive = strategy === 'recursive';
  if (language === 'langchain-py') return `# pip install langchain-text-splitters
from langchain_text_splitters import RecursiveCharacterTextSplitter, CharacterTextSplitter

# ${strategy} strategy mapped to a practical LangChain splitter
splitter = ${recursive ? 'RecursiveCharacterTextSplitter' : 'CharacterTextSplitter'}(
    chunk_size=${size},
    chunk_overlap=${overlap},
    ${recursive ? 'separators=["\\n\\n", "\\n", " ", ""]' : 'separator="\\n\\n"'}
)

with open("document.txt", encoding="utf-8") as file:
    source_text = file.read()

chunks = splitter.split_text(source_text)
print(f"Created {len(chunks)} chunks")
for index, chunk in enumerate(chunks, start=1):
    print(f"\\n--- Chunk {index} ---\\n{chunk}")
`;
  if (language === 'llama-py') return `# pip install llama-index-core
from llama_index.core import Document
from llama_index.core.node_parser import SentenceSplitter

# SentenceSplitter is a sentence-aware alternative to ${strategy} splitting.
splitter = SentenceSplitter(
    chunk_size=${size},
    chunk_overlap=${overlap},
)

with open("document.txt", encoding="utf-8") as file:
    source_text = file.read()

nodes = splitter.get_nodes_from_documents([Document(text=source_text)])
print(f"Created {len(nodes)} chunks")
for index, node in enumerate(nodes, start=1):
    print(f"\\n--- Chunk {index} ---\\n{node.get_content()}")
`;
  return [
    '// npm install @langchain/textsplitters',
    `import { ${recursive ? 'RecursiveCharacterTextSplitter' : 'CharacterTextSplitter'} } from "@langchain/textsplitters";`,
    'import { readFile } from "node:fs/promises";',
    '',
    `// ${strategy} strategy mapped to a practical LangChain splitter.`,
    `const splitter = new ${recursive ? 'RecursiveCharacterTextSplitter' : 'CharacterTextSplitter'}({`,
    `  chunkSize: ${size},`,
    `  chunkOverlap: ${overlap},`,
    `  ${recursive ? 'separators: ["\\n\\n", "\\n", " ", ""]' : 'separator: "\\n\\n"'}`,
    '});',
    '',
    'const sourceText = await readFile("document.txt", "utf8");',
    'const chunks = await splitter.splitText(sourceText);',
    'console.log(`Created ${chunks.length} chunks`);',
    'chunks.forEach((chunk, index) => console.log(`\\n--- Chunk ${index + 1} ---\\n${chunk}`));',
    ''
  ].join('\n');
}
