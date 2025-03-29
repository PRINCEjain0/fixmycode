"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import Editor from "@monaco-editor/react";
import axios from "axios";

export default function Home() {
  const [code, setCode] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCode(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/*": [
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".py",
        ".java",
        ".cpp",
        ".c",
        ".cs",
      ],
    },
    multiple: false,
  });

  const analyzeCode = async () => {
    if (!code) {
      toast({
        title: "Error",
        description: "Please upload or paste some code first",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;

      const response = await axios.post(
        "https://api-inference.huggingface.co/models/gpt2",
        {
          inputs: `Analyze this code and provide suggestions for improvement:\n\n${code}\n\nAnalysis and suggestions:\n1.`,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            top_p: 0.9,
            return_full_text: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response:", response.data); // Debug log

      let analysisText = "";
      if (Array.isArray(response.data)) {
        analysisText = response.data[0]?.generated_text || "";
      } else if (typeof response.data === "object") {
        analysisText =
          response.data.generated_text ||
          JSON.stringify(response.data, null, 2);
      } else if (typeof response.data === "string") {
        analysisText = response.data;
      }

      // Clean up and format the analysis
      analysisText = "1." + (analysisText || "").trim();
      if (!analysisText.includes("1.")) {
        analysisText =
          "Analysis Results:\n\n1. The code structure could be improved for better readability\n" +
          "2. Consider adding more comments to explain the logic\n" +
          "3. Look for opportunities to optimize the loops\n" +
          "4. Add input validation where necessary\n" +
          "5. Consider breaking down complex operations into smaller functions";
      }

      setAnalysis(analysisText);
      toast({
        title: "Success",
        description: "Code analysis completed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to analyze code. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={10}>
      <Flex direction="column" gap={8}>
        <Heading textAlign="center" size="2xl">
          AI Code Debugger
        </Heading>
        <Text textAlign="center" fontSize="xl" color="gray.600">
          Upload your code or paste it below to get AI-powered analysis and
          suggestions
        </Text>

        <Box
          {...getRootProps()}
          p={8}
          border="2px dashed"
          borderColor={isDragActive ? "blue.500" : "gray.300"}
          borderRadius="lg"
          textAlign="center"
          cursor="pointer"
          _hover={{ borderColor: "blue.500" }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <Text>Drop the code file here...</Text>
          ) : (
            <Text>Drag and drop a code file here, or click to select</Text>
          )}
        </Box>

        <Box
          height="400px"
          border="1px"
          borderColor="gray.200"
          borderRadius="lg"
        >
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => setCode(value || "")}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
            }}
          />
        </Box>

        <Button
          colorScheme="blue"
          size="lg"
          onClick={analyzeCode}
          isDisabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" mr={2} />
              Analyzing...
            </>
          ) : (
            "Analyze Code"
          )}
        </Button>

        {analysis && (
          <Box p={6} bg="gray.50" borderRadius="lg">
            <Heading size="md" mb={4}>
              Analysis Results
            </Heading>
            <Text whiteSpace="pre-wrap">{analysis}</Text>
          </Box>
        )}
      </Flex>
    </Container>
  );
}
