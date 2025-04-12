import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { inject, Injectable, makeStateKey, OnDestroy, PLATFORM_ID, TransferState } from "@angular/core";
import {
	Auth,
	authState,
	beforeAuthStateChanged,
	getRedirectResult,
	GithubAuthProvider,
	GoogleAuthProvider,
	onIdTokenChanged,
	signInWithPopup,
	User,
	UserCredential
} from "@angular/fire/auth";
import { Router } from "@angular/router";
import cookies from "js-cookie";
import { map, Observable, startWith, tap } from "rxjs";

@Injectable({
	providedIn: "root"
})
export class AuthService implements OnDestroy {
	private readonly auth = inject(Auth);
	protected readonly authState = authState(this.auth);

	private readonly unsubscribeFromOnIdTokenChanged: (() => void) | undefined;
	private readonly unsubscribeFromBeforeAuthStateChanged: (() => void) | undefined;

	private readonly transferState = inject(TransferState);
	private readonly transferStateKey = makeStateKey<string | undefined>("auth:uid");

	readonly uid = this.authState
		.pipe(map((u) => u?.uid))
		.pipe(
			isPlatformServer(inject(PLATFORM_ID))
				? tap((it) => this.transferState.set(this.transferStateKey, it))
				: this.transferState.hasKey(this.transferStateKey)
					? startWith(this.transferState.get(this.transferStateKey, undefined))
					: tap()
		);

	constructor(private router: Router) {
		if (isPlatformBrowser(inject(PLATFORM_ID))) {
			this.unsubscribeFromOnIdTokenChanged = onIdTokenChanged(this.auth, async (user) => {
				if (user) {
					const idToken = await user.getIdToken();
					cookies.set("__session", idToken);
				} else {
					cookies.remove("__session");
				}
			});

			let priorCookieValue: string | undefined;
			this.unsubscribeFromBeforeAuthStateChanged = beforeAuthStateChanged(
				this.auth,
				async (user) => {
					priorCookieValue = cookies.get("__session");
					const idToken = await user?.getIdToken();
					if (idToken) {
						cookies.set("__session", idToken);
					} else {
						cookies.remove("__session");
					}
				},
				async () => {
					if (priorCookieValue) {
						cookies.set("__session", priorCookieValue);
					} else {
						cookies.remove("__session");
					}
				}
			);
		}
	}

	ngOnDestroy(): void {
		this.unsubscribeFromBeforeAuthStateChanged?.();
		this.unsubscribeFromOnIdTokenChanged?.();
	}

	getCurrentUser$(): Observable<User | null> {
		return authState(this.auth);
	}

	isLoggedIn$(): Observable<boolean> {
		return this.getCurrentUser$().pipe(map((user) => !!user));
	}

	getRedirectResult(): Promise<UserCredential | null> {
		return getRedirectResult(this.auth);
	}

	async login(providerName: "google" | "github"): Promise<UserCredential> {
		const provider = providerName === "google" ? new GoogleAuthProvider() : new GithubAuthProvider();

		return signInWithPopup(this.auth, provider);
	}

	async logout() {
		await this.auth.signOut();
		await this.router.navigate(["login"]);
	}
}
