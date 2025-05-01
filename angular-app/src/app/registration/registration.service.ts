import { inject, Injectable } from "@angular/core";
import { AuthService } from "../services/auth.service";
import cookies from "js-cookie";
import { Auth, createUserWithEmailAndPassword, updateProfile, UserCredential } from "@angular/fire/auth";
import { doc, Firestore, setDoc } from "@angular/fire/firestore";
import { Router } from "@angular/router";

@Injectable({
	providedIn: "root"
})
export class RegistrationService {
	private firestore = inject(Firestore);
	private auth = inject(Auth);
	private authService = inject(AuthService);
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

			await this.router.navigate(["profile", "health-profile"]);
		}

		return credential;
	}

	async registerWithProvider(provider: "google" | "github"): Promise<UserCredential | undefined> {
		return this.authService.providerLogin(provider);
	}

	private addDisplayName(uid: string, displayName: string): Promise<void> {
		const docRef = doc(this.firestore, "users", uid);

		return setDoc(docRef, { displayName }, { merge: true });
	}
}
