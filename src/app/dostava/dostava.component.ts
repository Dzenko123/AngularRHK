import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MojConfig } from '../moj-config';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AutentifikacijaHelper } from '../_helpers/autentifikacija-helper';
import { UserAuthService } from '../user-auth.service';
import { Router } from '@angular/router';
import { LoginInformacije } from '../_helpers/login-informacije';

declare function porukaSuccess(a: string): any;
declare function porukaError(a: string): any;

@Component({
  selector: 'app-dostava',
  templateUrl: './dostava.component.html',
  styleUrls: ['./dostava.component.css']
})
export class DostavaComponent implements OnInit {
  kategorije: any[];
  odabranaKategorija: any;
  meniUKategoriji: any[];
  sviMeni: any[];
  odabranaJela: any[] = [];
  dostave: any[];
  ukupnaCijena: number = 0;
  prikaziDostaviButton: boolean = false;
  otvoriFormu: boolean = false;
  selectedMeniItems: number[] = [];

  dostavaVM = {
    Cijena: 0, // Changed to a number type
    Kolicina: 0,
    Adresa: '',
    Telefon: '',
    meni_id: null as number | null,
    korisnik_id: null as number | null,
  };

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private userAuthService: UserAuthService,
    private router: Router
  ) {}

  loginInformation = AutentifikacijaHelper.getLoginInfo();

  korisnik: any;

  ngOnInit() {
    this.dohvatiKategorije();
    this.dohvatiSveMeni();
    this.dohvatiDostave();
    this.GetKorisnici();
  }

  GetKorisnici() {
    this.http
      .get(MojConfig.adresa_servera + '/Korisnik/GetById?id=' + this.loginInformation.autentifikacijaToken.korisnickiNalogId)
      .subscribe((x) => {
        this.korisnik = x;
        console.log(this.korisnik);
      });
  }

  dohvatiDostave() {
    this.http.get(MojConfig.adresa_servera + '/Dostava/GetAll').subscribe((data: any) => {
      this.dostave = data;
    });
  }

  dodajUkosaricu(meni: any) {
    if (!meni.kolicina || meni.kolicina < 1) {
      porukaError('Unesite količinu');
      return;
    }
    const postojecaStavka = this.odabranaJela.find((jelo) => jelo.id === meni.id);

    if (postojecaStavka) {
      postojecaStavka.kolicina += meni.kolicina;
    } else {
      const odabranoJelo = {
        id: meni.id,
        naziv: meni.naziv,
        cijena: meni.cijena,
        kolicina: meni.kolicina,
      };
      this.odabranaJela.push(odabranoJelo);
      this.selectedMeniItems.push(meni.id);
    }
    this.izracunajUkupnuCijenu();
    this.prikaziDostaviButton = true;
    this.dostavaVM.Kolicina = meni.kolicina; // Update the Kolicina in the modal

    porukaSuccess(`Jelo ${meni.naziv} dodano u košaricu u količini od ${meni.kolicina} komada.`);
    console.log(`Dodano jelo s ID: ${meni.id}, količina: ${meni.kolicina}`);
  }


  izracunajUkupnuCijenu() {
    this.ukupnaCijena = this.odabranaJela.reduce((total, jelo) => total + jelo.cijena * jelo.kolicina, 0);
    this.dostavaVM.Cijena=this.ukupnaCijena;
  }

  dohvatiKategorije() {
    this.http.get(MojConfig.adresa_servera + '/Kategorija/GetAll').subscribe((data: any) => {
      this.kategorije = data;
    });
  }

  dohvatiSveMeni() {
    this.http.get(MojConfig.adresa_servera + '/Meni/GetAll').subscribe((data: any) => {
      this.sviMeni = data;
    });
  }

  odaberiKategoriju(kategorija: any) {
    this.odabranaKategorija = kategorija;
    this.meniUKategoriji = this.sviMeni.filter((meni) => meni.kategorija_id === kategorija.id);
    console.log(this.meniUKategoriji);
  }

  sanitizeImage(imageData: string): SafeUrl {
    if (imageData) {
      const imageUrl = 'data:image/png;base64,' + imageData;
      return this.sanitizer.bypassSecurityTrustUrl(imageUrl);
    }
    return '';
  }

  postaviDefaultnuKolicinu(meni: any) {
    if (!meni.kolicina || meni.kolicina < 1) {
      meni.kolicina = 1;
    }
  }

  resetForm() {
    this.dostavaVM = {
      Cijena: 0, // Changed to a number type
      Kolicina: 0,
      Adresa: '',
      Telefon: '',
      meni_id: null,
      korisnik_id: null,
    };
  }

  submitDostavaForm() {
    // Validate the form if needed

    const dostavaAddVM = {
      Cijena: this.ukupnaCijena,
      Kolicina: this.dostavaVM.Kolicina,
      Adresa: this.dostavaVM.Adresa,
      BrojTelefona: this.dostavaVM.Telefon,
      korisnik_id: this.korisnik.id,
      MeniItems: this.selectedMeniItems,
    };

    this.http.post(MojConfig.adresa_servera + '/api/dostava', dostavaAddVM).subscribe(
      (response: any) => {
        porukaSuccess(response.message);
        this.resetForm();
        this.router.navigate(['/dostava']);
      },
      (error) => {
        porukaError('Greška prilikom slanja dostave');
      }
    );
  }
}