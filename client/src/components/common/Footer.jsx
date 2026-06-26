export default function Footer() {
    return (
        <footer className="bg-aggie-dark text-gray-400 text-center text-sm py-6 mt-auto">
            <p>© {new Date().getFullYear()} Aggie Connect — NC A&T CS Department</p>
            <p className="mt-1">Built by Aggies, for Aggies 🟢🟡</p>
        </footer>
    );
}