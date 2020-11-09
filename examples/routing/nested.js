import $ from "../../lib";
import router from "../../router";

const topics = [
  {
    name: "React Router",
    id: "react-router",
    description: "Declarative, component based routing for React",
    resources: [
      {
        name: "URL Parameters",
        id: "url-parameters",
        description:
          "URL parameters are parameters whose values are set dynamically in a page's URL. This allows a route to render the same component while passing that component the dynamic portion of the URL so it can change based off of it.",
        url: "https://ui.dev/react-router-url-parameters/",
      },
      {
        name: "Programmatically navigate",
        id: "programmatically-navigate",
        description:
          "When building an app with React Router, eventually you'll run into the question of navigating programmatically. The goal of this post is to break down the correct approaches to programmatically navigating with React Router.",
        url: "https://ui.dev/react-router-programmatically-navigate/",
      },
    ],
  },
  {
    name: "React.js",
    id: "reactjs",
    description: "A JavaScript library for building user interfaces",
    resources: [
      {
        name: "React Lifecycle Events",
        id: "react-lifecycle",
        description:
          "React Lifecycle events allow you to tie into specific phases of a components lifecycle",
        url: "https://ui.dev/an-introduction-to-life-cycle-events-in-react-js/",
      },
      {
        name: "React AHA Moments",
        id: "react-aha",
        description: "A collection of 'Aha' moments while learning React.",
        url: "https://ui.dev/react-aha-moments/",
      },
    ],
  },
  {
    name: "Functional Programming",
    id: "functional-programming",
    description:
      "In computer science, functional programming is a programming paradigm—a style of building the structure and elements of computer programs—that treats computation as the evaluation of mathematical functions and avoids changing-state and mutable data.",
    resources: [
      {
        name: "Imperative vs Declarative programming",
        id: "imperative-declarative",
        description:
          "A guide to understanding the difference between Imperative and Declarative programming.",
        url: "https://ui.dev/imperative-vs-declarative-programming/",
      },
      {
        name:
          "Building User Interfaces with Pure Functions and Function Composition",
        id: "fn-composition",
        description:
          "A guide to building UI with pure functions and function composition in React",
        url:
          "https://ui.dev/building-user-interfaces-with-pure-functions-and-function-composition-in-react-js/",
      },
    ],
  },
];

const Home = () => "";
const TopicList = ({ match }) => $`
  <ul>
    ${topics.map(
      (topic) =>
        $`<li><a ${{ href: match.add.url(topic.id) }} ${router.link}>${
          topic.name
        }</a></li>`
    )}
  </ul>
  <hr/>
  ${router(topicRoutes)}
`;

const Topic = ({ match }) => {
  const topic = topics.find((x) => x.id === match.params.topicId);
  return $`
    <h2>Topic: ${topic.name}</h2>
    <p>${topic.description}</p>
    <ul>
    ${topic.resources.map(
      (res) =>
        $`<li><a ${{ href: match.add.url(res.id) }} ${router.link}>${
          res.name
        }</a></li>`
    )}
  </ul>
  <hr/>
  ${router(resourceRoutes)}
  `;
};

const ResourceList = ({ match }) => {
  const resource = topics
    .find(({ id }) => id === match.params.topicId)
    .resources.find(({ id }) => id === match.params.resId);
  return $`
    <div>
      <h3>Resource: ${resource.name}</h3>
      <p>${resource.description}</p>
      <a ${{ href: resource.url }}>More info</a>
    </div>
    `;
};

const rootRoutes = {
  "/$": Home,
  "/topic": TopicList,
};
const topicRoutes = {
  nested: true,
  ":topicId": Topic,
};
const resourceRoutes = {
  nested: true,
  ":resId": ResourceList,
};

$.render($`
  <h1>Nested Route Demo</h1>
  <p>
    <a href="/" ${router.link}>Home</a> |
    <a href="/topic" ${router.link}>Topics</a>
  </p>
  ${router(rootRoutes)}
`);
