import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { StreamLanguage } from "@codemirror/language";
import { properties } from "@codemirror/legacy-modes/mode/properties";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import type { Extension } from "@codemirror/state";
import type { Format } from "../_lib/formats";

export function getLanguageExtension(format: Format): Extension {
  switch (format) {
    case "JSON":
      return json();
    case "YAML":
      return yaml();
    case "XML":
      return xml();
    case "TOML":
      return StreamLanguage.define(toml);
    case "INI":
      return StreamLanguage.define(properties);
    case "CSV":
      return [];
  }
}
