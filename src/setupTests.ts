// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

const translationPath = path.resolve(__dirname, "./locales/es/translation.json");
const translation = JSON.parse(fs.readFileSync(translationPath, "utf8"));

function resolveKey(obj: any, key: string): string {
  const parts = key.split(".");
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      console.warn(`[test.i18n] Key not found: ${key} (at part: ${part})`);
      return key; // Return key if not found
    }
  }
  if (typeof current !== "string") {
    console.warn(`[test.i18n] Key resolved to non-string: ${key} (value: ${typeof current})`);
    return key;
  }
  return current;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (key: string, options?: any) => {
        let result = resolveKey(translation, key);
        if (options) {
          Object.keys(options).forEach((optKey) => {
            result = result.replace(`{{${optKey}}}`, options[optKey]);
          });
        }
        return result;
      },
      i18n: {
        changeLanguage: () => new Promise(() => {}),
        language: "es",
      },
    };
  },
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
  Trans: ({ children }: { children: any }) => children,
}));
