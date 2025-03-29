import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "the people i've met landing page" },
    { name: "description", content: "maybe a short description of what this website is about" },
  ];
};

export default function Index() {
  return (<>
  HELLO!
  </>) 
}