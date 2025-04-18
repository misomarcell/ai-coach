import { Injectable } from "@angular/core";
import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function passwordMatchValidator(passwordField: string, confirmField: string): ValidatorFn {
	return (formGroup: AbstractControl): ValidationErrors | null => {
		const password = formGroup.get(passwordField);
		const confirm = formGroup.get(confirmField);

		if (!password || !confirm) return null;

		return password.value === confirm.value ? null : { passwordMismatch: true };
	};
}

@Injectable({
	providedIn: "root"
})
export class FormService {}
