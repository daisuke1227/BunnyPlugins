import { plugin } from "@vendetta";
import { manifest } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";

import { patchSettingsPin } from "$/lib/pinToSettings";

import { lang, vstorage } from "..";
import Settings from "../components/Settings";
import { unsubAuthStore } from "../stores/AuthorizationStore";
import { unsubCacheStore } from "../stores/CacheStore";

export default (): (() => void) => {
    const patches = new Array<any>();
    patches.push(
        patchSettingsPin({
            key: plugin.manifest.name,
            icon: getAssetIDByName(manifest.vendetta?.icon ?? ""),
            title: () => lang.format("plugin.name", {}),
            predicate: () => useProxy(vstorage).config.addToSettings,
            page: Settings,
        }),
    );
    patches.push(unsubAuthStore);
    patches.push(unsubCacheStore);

    return () => {
        patches.forEach(x => x());
    };
};
