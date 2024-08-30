import { Injectable } from "@angular/core";
import { AsyncSubject, Observable } from "rxjs";
import SHA256 from "crypto-js/sha256";
import Hex from "crypto-js/enc-hex";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  signIn(username: string, password: string): Observable<any> {
    // persist in localstorage
    console.info('Performing Sign-In for:', username);
    const out = new AsyncSubject<any>();
    out.next(SHA256(`${username}/${password}`).toString(Hex));
    out.complete();
    return out;
  }
}
