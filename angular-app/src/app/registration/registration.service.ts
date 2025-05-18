import { inject, Injectable } from "@angular/core";
import { Auth, createUserWithEmailAndPassword, updateProfile, UserCredential } from "@angular/fire/auth";
import { doc, Firestore, setDoc } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import cookies from "js-cookie";
import { ExternalAuthProvider, AuthService } from "../services/auth.service";
import { Analytics, logEvent } from "@angular/fire/analytics";

@Injectable({
	providedIn: "root"
})
export class RegistrationService {
	private firestore = inject(Firestore);
	private auth = inject(Auth);
	private authService = inject(AuthService);
	private analytics = inject(Analytics);
	private router = inject(Router);

	async register(email: string, password: string, displayName: string): Promise<UserCredential> {
		const credential = await createUserWithEmailAndPassword(this.auth, email, password);
		if (credential.user) {
			cookies.set("__session", await credential.user.getIdToken());
			await this.addDisplayName(credential.user.uid, displayName);
			await this.authService.requestEmailVerification(credential.user);
			await updateProfile(credential.user, {
				displayName
			});

			await logEvent(this.analytics, "registration", { provider: "email" });
			await this.router.navigate(["profile", "health-profile"]);
		}

		return credential;
	}

	async registerWithProvider(provider: ExternalAuthProvider): Promise<UserCredential | undefined> {
		return this.authService.providerLogin(provider);
	}

	private addDisplayName(uid: string, displayName: string): Promise<void> {
		const docRef = doc(this.firestore, "users", uid);

		return setDoc(docRef, { displayName }, { merge: true });
	}
}
