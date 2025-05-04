import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Auth, authState } from "@angular/fire/auth";
import { catchError, filter, from, map, Observable, switchMap } from "rxjs";
import { environment } from "../../environments/environment";

@Injectable({
	providedIn: "root"
})
export class ApiService {
	private httpClient = inject(HttpClient);
	private auth = inject(Auth);

	get<T>(endpoint: string, params?: HttpParams): Observable<T> {
		return this.createHeaders().pipe(
			switchMap((headers) => this.httpClient.get<T>(`${environment.apiUrl}/${endpoint}`, { headers, params })),
			catchError((error) => {
				console.error("GET request failed", error);
				throw error;
			})
		);
	}

	post<T>(endpoint: string, body: any): Observable<T> {
		return this.createHeaders().pipe(
			switchMap((headers) => this.httpClient.post<T>(`${environment.apiUrl}/${endpoint}`, body, { headers })),
			catchError((error) => {
				console.error("POST request failed", error);
				throw error;
			})
		);
	}

	put<T>(endpoint: string, body: any): Observable<T> {
		return this.createHeaders().pipe(
			switchMap((headers) => this.httpClient.put<T>(`${environment.apiUrl}/${endpoint}`, body, { headers })),
			catchError((error) => {
				console.error("PUT request failed", error);
				throw error;
			})
		);
	}

	delete<T>(endpoint: string, params?: HttpParams): Observable<T> {
		return this.createHeaders().pipe(
			switchMap((headers) => this.httpClient.delete<T>(`${environment.apiUrl}/${endpoint}`, { headers, params })),
			catchError((error) => {
				console.error("DELETE request failed", error);
				throw error;
			})
		);
	}

	private createHeaders(): Observable<HttpHeaders> {
		return authState(this.auth).pipe(
			filter((user) => !!user),
			switchMap((user) => from(user.getIdTokenResult())),
			map((token) => {
				const headers = new HttpHeaders().set("Content-Type", "application/json");
				if (token) {
					headers.set("Authorization", `Bearer ${token}`);
				}

				return headers;
			})
		);
	}
}
