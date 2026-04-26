export const FORMATS = ["JSON", "YAML", "TOML", "XML", "CSV", "INI"] as const;
export type Format = (typeof FORMATS)[number];

export const POPULAR: { from: Format; to: Format }[] = [
  { from: "JSON", to: "YAML" },
  { from: "YAML", to: "JSON" },
  { from: "JSON", to: "TOML" },
  { from: "XML", to: "JSON" },
];

export const ALL_PAIRS: { from: Format; to: Format }[] = FORMATS.flatMap((f) =>
  FORMATS.filter((t) => t !== f).map((t) => ({ from: f, to: t })),
);

export const SAMPLE_INPUT = `{
  "name": "my-app",
  "version": "1.0.0",
  "config": {
    "debug": true,
    "port": 3000,
    "database": {
      "host": "localhost",
      "name": "appdb"
    },
    "tags": ["web", "api", "oss"]
  }
}`;

export const SAMPLE_OUTPUT = `name: my-app
version: 1.0.0
config:
  debug: true
  port: 3000
  database:
    host: localhost
    name: appdb
  tags:
    - web
    - api
    - oss`;

export const FAQ_ITEMS = [
  {
    q: "Is my data safe?",
    a: "Completely. All conversion happens in your browser using JavaScript — no data is ever sent to our servers. You can even use this tool offline after the page has loaded.",
  },
  {
    q: "What's the maximum file size I can convert?",
    a: "There's no hard limit imposed by our tool. Performance depends on your browser and device, but files up to 10 MB typically convert in under a second. Very large files may be slow.",
  },
  {
    q: "Does this work offline?",
    a: "Yes. Once the page is loaded, the conversion engine runs entirely client-side. You can disconnect from the internet and continue converting files without any issues.",
  },
  {
    q: "Are there any YAML features that don't map to JSON?",
    a: "Yes — YAML supports comments, multi-line strings, anchors and aliases, and custom tags. These features don't have JSON equivalents. Our converter preserves data but strips comments and resolves anchors.",
  },
  {
    q: "Why does my JSON fail to convert?",
    a: "The most common cause is invalid JSON syntax — trailing commas, unquoted keys, or single quotes instead of double quotes. The status strip below the editor will show the exact error and line number.",
  },
  {
    q: "Can I convert multiple files at once?",
    a: "Batch conversion isn't supported in the free online tool, but our CLI (coming soon) will support piping and directory conversion. Subscribe to our newsletter to be notified.",
  },
];

export const USE_CASES = [
  {
    title: "Kubernetes configs",
    desc: "K8s manifests, Helm charts, and kustomize overlays all use YAML natively. Convert JSON configs from CI pipelines in one click.",
    icon: "Server",
  },
  {
    title: "CI/CD pipelines",
    desc: "GitHub Actions, GitLab CI, and CircleCI all use YAML workflow definitions. Convert your JSON config exports seamlessly.",
    icon: "GitBranch",
  },
  {
    title: "Ansible playbooks",
    desc: "Ansible's YAML DSL for infrastructure automation. Migrate JSON variable files and inventory exports to valid playbook format.",
    icon: "Terminal",
  },
  {
    title: "Config migration",
    desc: "Moving between frameworks often means converting .json to .yaml or .toml. Handle entire config directories format-by-format.",
    icon: "RefreshCw",
  },
] as const;

export const COMPARE_ROWS = [
  {
    feature: "Syntax",
    from: "Curly braces, square brackets, quoted strings",
    to: "Indentation-based, minimal punctuation",
  },
  {
    feature: "Comments",
    from: "Not supported",
    to: "Supported with # character",
  },
  {
    feature: "Data types",
    from: "String, number, boolean, array, object, null",
    to: "Same + timestamps, binary, anchors & aliases",
  },
  {
    feature: "Readability",
    from: "Moderate — verbose for humans",
    to: "High — designed for human readability",
  },
  {
    feature: "Spec strictness",
    from: "Strict — errors on trailing commas",
    to: "Lenient — multiple valid representations",
  },
  {
    feature: "Common uses",
    from: "REST APIs, package.json, config files",
    to: "Kubernetes, CI/CD, Ansible, Docker Compose",
  },
];

export function isFormat(value: string): value is Format {
  return (FORMATS as readonly string[]).includes(value);
}

export function pairHref(from: Format, to: Format): string {
  return `/${from.toLowerCase()}/${to.toLowerCase()}`;
}
