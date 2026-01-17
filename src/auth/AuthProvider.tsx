
import { AuthProvider as OIDCAuthProvider } from "react-oidc-context";
import { User } from "oidc-client-ts";

const oidcConfig = {
    authority: import.meta.env.VITE_KEYCLOAK_URL,
    client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    redirect_uri: window.location.origin,
    onSigninCallback: (_user: User | void): void => {
        window.history.replaceState({}, document.title, window.location.pathname);
    },
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    return <OIDCAuthProvider {...oidcConfig}>{children}</OIDCAuthProvider>;
};
