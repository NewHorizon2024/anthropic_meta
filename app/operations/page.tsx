"use client";

import { useEffect } from "react";
import Chat from "../_components/chat/Chat";

const COMMENTS = "https://jsonplaceholder.typicode.com/comments";
export default function OperationsHome() {
  async function startStream() {
    const stream = new ReadableStream({
      start(controller) {
        let i = 0;

        const start = setInterval(() => {
          i++;
          controller.enqueue(i);
        }, 1000);
        if (i >= 100) {
          clearInterval(start);
          controller.close();
        }
      },
    });

    return stream;
  }

  const transformToMultiple = new TransformStream({
    transform(chunk, controller) {
      if (chunk === 10) {
        controller.enqueue("Mostafa Software AI")
      }
      controller.enqueue(chunk * 2);
    },
  });

  async function testStream() {
   const response = await startStream();
    const multiple = response.pipeThrough(transformToMultiple)

    const reader = multiple.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      console.log(value);
    }
  }

  async function testFetch() {
    const response = await fetch("http://localhost:3001/");
   
    const reader = response.body?.getReader();
    while (true) {
      const { value, done } = await reader!.read();
      if (done) break;

      // console.log(new TextDecoder().decode(value));
      console.log(value);
    }
    // // Fetch the original image
    // fetch(COMMENTS)
    //   // Retrieve its body as ReadableStream
    //   .then((response) => {
    //     const reader = response.body?.getReader();
    //     return new ReadableStream({
    //       start(controller) {
    //         return pump();
    //         function pump(): Promise<void> {
    //           return (
    //             reader?.read().then(({ done, value }) => {
    //               // When no more data needs to be consumed, close the stream
    //               if (done) {
    //                 controller.close();
    //                 return;
    //               }
    //               // Enqueue the next data chunk into our target stream
    //               controller.enqueue(value);
    //               return pump();
    //             }) ?? Promise.resolve()
    //           );
    //         }
    //       },
    //     });
    //   })
    //   // Create a new response out of the stream
    //   .then((stream) => new Response(stream))
    //   // Create an object URL for the response
    //   .then((response) => response.json())
    //   .then((data) => console.log(data))
    //   // Update image

    //   .catch((err) => console.error(err));
  }
  return (
    <div>
      <Chat chatTitle="Public Chat" />
    </div>
  );
}
