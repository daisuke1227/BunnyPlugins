import { findByProps, findByStoreName } from "@vendetta/metro";
import { FluxDispatcher } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

import Modal from "./components/Modal";

const ThemeStore = findByStoreName("ThemeStore");
const { triggerHaptic } = findByProps("triggerHaptic");

const colorModule = findByProps("colors", "unsafe_rawColors");
const colorResolver = colorModule?.internal ?? colorModule?.meta;

export const TextStyleSheet = findByProps("TextStyleSheet")
    .TextStyleSheet as _TextStyleSheet;

export const Navigator = findByProps("Navigator")?.Navigator;
export const modalCloseButton = findByProps(
    "getHeaderCloseButton",
)?.getHeaderCloseButton;
export const { popModal, pushModal } = findByProps("popModal", "pushModal");

export type Entries<T> = [keyof T, T[keyof T]];

// ...
export const getDiscordTheme = () => {
    // getDefaultFallbackTheme is not exported :(
    const { theme } = ThemeStore;

    if (theme.startsWith("vd-theme-")) return theme.split("-")[3];
    else return theme;
};

export const resolveCustomSemantic = (dark: string, light: string) =>
    getDiscordTheme() === "light" ? light : dark;

export const lerp = (og: string, target: string, perc: number) => {
    const hex2rgb = (hex: string) =>
        hex.match(/\w\w/g)?.map(x => parseInt(x, 16)) ?? [0, 0, 0];
    const rgb2hex = (rgb: number[]) =>
        `#${rgb.map(x => x.toString(16).padStart(2, "0")).join("")}`;

    const ogR = hex2rgb(og);
    const targetR = hex2rgb(target);

    const result = ogR.map((ogC, i) =>
        Math.round(ogC + (targetR[i] - ogC) * perc),
    );

    return rgb2hex(result);
};

export function resolveSemanticColor(
    color: any,
    theme: string = ThemeStore.theme,
) {
    return colorResolver?.resolveSemanticColor(theme, color);
}

export function getUserAvatar(
    user: {
        discriminator: string;
        avatar?: string;
        id: string;
    },
    animated?: boolean,
): string {
    const isPomelo = user.discriminator === "0";

    return user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${
              animated && user.avatar.startsWith("a_")
                  ? `${user.avatar}.gif`
                  : `${user.avatar}.png`
          }`
        : `https://cdn.discordapp.com/embed/avatars/${
              isPomelo
                  ? (parseInt(user.id) >> 22) % 6
                  : parseInt(user.discriminator) % 5
          }`;
}

export function openModal(key: string, modal: typeof Modal) {
    const empty = Symbol("empty");
    if (!Navigator || !modalCloseButton) {
        showToast(
            `${[
                Navigator ? empty : "Navigator",
                modalCloseButton ? empty : "modalCloseButton",
            ]
                .filter(x => x !== empty)
                .join(", ")} is missing! Please try reinstalling your client.`,
            getAssetIDByName("CircleXIcon-primary"),
        );
        return;
    }

    pushModal({
        key,
        modal: {
            key,
            modal,
            animation: "slide-up",
            shouldPersistUnderModals: false,
            closable: true,
        },
    });
}

export function doHaptic(dur: number): Promise<void> {
    triggerHaptic();
    const interval = setInterval(() => triggerHaptic(), 1);
    return new Promise(res =>
        setTimeout(() => res(clearInterval(interval)), dur),
    );
}

export function androidifyColor(color: string, alpha = 255): number {
    const [_, r, g, b] =
        color.match(/#([A-F0-9]{2})([A-F0-9]{2})([A-F0-9]{2})/i) ?? [];
    if (!_) return 0;

    return (
        ((alpha & 0xff) << 24) |
        ((parseInt(r, 16) & 0xff) << 16) |
        ((parseInt(g, 16) & 0xff) << 8) |
        (parseInt(b, 16) & 0xff)
    );
}

export function fluxSubscribe(
    topic: string,
    callback: (data: any) => void,
    once?: boolean,
) {
    const cback = (data: any) => (
        callback(data), once && FluxDispatcher.unsubscribe(topic, cback)
    );
    FluxDispatcher.subscribe(topic, cback);
    return () => FluxDispatcher.unsubscribe(topic, cback);
}

export function formatBytes(bytes: number) {
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 B";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export function deepEquals(x: any, y: any) {
    if (x === y) return true;
    else if (typeof x === "object" && typeof y === "object" && x && y) {
        if (Object.keys(x).length !== Object.keys(y).length) return false;

        for (const prop in x)
            if (Object.prototype.hasOwnProperty.call(y, prop)) {
                if (!deepEquals(x[prop], y[prop])) return false;
            } else return false;

        return true;
    }
}

// ...

export type TextStyleSheetCase = "normal" | "medium" | "semibold" | "bold";

type TextStyleSheetHasExtraBoldCase =
    | "heading-sm"
    | "heading-md"
    | "heading-lg"
    | "heading-xl"
    | "heading-xxl"
    | "heading-deprecated-12";
export type TextStyleSheetHasCase =
    | TextStyleSheetHasExtraBoldCase
    | "text-xxs"
    | "text-xs"
    | "text-sm"
    | "text-md"
    | "text-lg"
    | "redesign/message-preview"
    | "redesign/channel-title";

export type TextStyleSheetVariant =
    | `${TextStyleSheetHasCase}/${TextStyleSheetCase}`
    | `${TextStyleSheetHasExtraBoldCase}/${TextStyleSheetCase | "extrabold"}`
    | "eyebrow"
    | "redesign/heading-18/bold"
    | "display-sm"
    | "display-md"
    | "display-lg";

type _TextStyleSheet = Record<
    TextStyleSheetVariant,
    {
        fontSize: number;
        lineHeight: number;
        textTransform: "none" | "capitalize" | "uppercase" | "lowercase";
        fontFamily: string;
        includeFontPadding: boolean;
        letterSpacing?: number;
    }
>;

export interface SearchContext {
    type: string;
    [key: PropertyKey]: any;
}

export function isObject(x: Record<any, any>) {
    return typeof x === "object" && !Array.isArray(x);
}
