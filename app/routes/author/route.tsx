import { Outlet } from "@remix-run/react";

export default function AuthorRoute() {
    return (
        <div style={{ padding: "1rem", fontFamily: "Arial, sans-serif" }}>
            <h1>About Me</h1>
            <p>
                Hi, I&apos;m Peter! I&apos;m a software developer who loves building web
                applications and exploring new technologies. In my free time, I enjoy
                reading, hiking, and meeting new people.
            </p>
            <Outlet />
        </div>
    );
}