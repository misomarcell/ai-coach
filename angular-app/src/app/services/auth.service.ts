import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { inject, Injectable, makeStateKey, OnDestroy, PLATFORM_ID, TransferState } from "@angular/core";
import {
	applyActionCode,
	Auth,
	authState,
	beforeAuthStateChanged,
	confirmPasswordReset,
	getRedirectResult,
	GithubAuthProvider,
	GoogleAuthProvider,
	onIdTokenChanged,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	User,
	UserCredential,
	verifyBeforeUpdateEmail,
	verifyPasswordResetCode
} from "@angular/fire/auth";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import cookies from "js-cookie";
import { filter, from, map, Observable, of, startWith, switchMap, take, tap } from "rxjs";

export type ExternalAuthProvider = "google" | "github" | "facebook";

@Injectable({
	providedIn: "root"
})
export class AuthService implements OnDestroy {
	private snackBar = inject(MatSnackBar);
	private router = inject(Router);

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

	constructor() {
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

	getCurrentUser(): Observable<User | null> {
		return this.authState;
	}

	isLoggedIn(): Observable<boolean> {
		return this.authState.pipe(map((user) => !!user));
	}

	getRedirectResult(): Promise<UserCredential | null> {
		return getRedirectResult(this.auth);
	}

	isAdmin(): Observable<boolean> {
		return authState(this.auth).pipe(
			take(1),
			switchMap((user) => (user ? from(user?.getIdTokenResult()) : of(null))),
			map((idTokenResult) => !!idTokenResult?.claims["admin"])
		);
	}

	async normalLogin(email: string, password: string): Promise<UserCredential | undefined> {
		const credential = await signInWithEmailAndPassword(this.auth, email, password).catch((error) => this.handleAuthError(error));

		if (credential?.user) {
			cookies.set("__session", await credential.user.getIdToken());
			await this.router.navigate(["dashboard"]);
		}

		return credential;
	}

	async providerLogin(providerName: ExternalAuthProvider): Promise<UserCredential> {
		const provider = providerName === "google" ? new GoogleAuthProvider() : new GithubAuthProvider();
		const credential = await signInWithPopup(this.auth, provider).catch((error) => this.handleAuthError(error));

		if (credential.user) {
			cookies.set("__session", await credential.user.getIdToken());
			this.router.navigate(["dashboard"]);
		}

		return credential;
	}

	async getResetPasswordEmail(code: string): Promise<{ email?: string; error?: any }> {
		return verifyPasswordResetCode(this.auth, code)
			.then((email) => ({ email }))
			.catch((error) => ({ error }));
	}

	async resetPassword(email: string): Promise<{ error?: any } | void> {
		try {
			await sendPasswordResetEmail(this.auth, email);
		} catch (error) {
			this.handleAuthError(error);

			return { error };
		}
	}

	async updatePassword(code: string, email: string): Promise<void> {
		await confirmPasswordReset(this.auth, code, email);
	}

	async verifyEmail(code: string): Promise<void> {
		await applyActionCode(this.auth, code);
	}

	async requestEmailVerification(user: User): Promise<void> {
		if (!user || user.emailVerified) {
			throw new Error("User not logged in or email is already verified.");
		}

		await sendEmailVerification(user);
	}

	updateEmail(newEmail: string): Observable<void> {
		return this.getCurrentUser().pipe(
			filter((user) => !!user),
			take(1),
			switchMap((user) => from(verifyBeforeUpdateEmail(user, newEmail)))
		);
	}

	async logout() {
		await this.auth
			.signOut()
			.then(() => this.router.navigate(["/"]))
			.then(() => window.location.reload());
	}

	private handleAuthError(error: any): any {
		let message = "Authentication failed. Please try again.";
		switch (error.code) {
			case "auth/user-not-found":
				message = "User not found. Please check your email address.";
				break;
			case "auth/email-already-in-use":
				message = "This e-mail is already in use.";
				break;
			case "auth/invalid-credential":
				message = "Invalid credentials. Please check your email and password.";
				break;
			case "auth/invalid-email":
				message = "Invalid email address. Please check your email address.";
				break;
			case "auth/invalid-display-name":
				message = "Invalid display name. Please check your display name.";
				break;
			case "auth/wrong-password":
				message = "Invalid password. Please check your password.";
				break;
			case "auth/user-disabled":
				message = "User account is disabled.";
				break;
			case "auth/operation-not-allowed":
				message = "Account creation is disabled. Please contact support.";
				break;
			case "auth/account-exists-with-different-credential":
				message = "An account already exists with the same email address.";
				break;
			default:
				console.error("Auth error:", error);
				break;
		}

		this.snackBar.open(message, "Close", {
			panelClass: ["snackbar-error"]
		});
	}
}
