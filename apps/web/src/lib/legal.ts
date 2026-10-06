/**
 * Legal page templates. The company identity (name, address, contact e-mail) is the one published by the operator's other
 * shop (fr.reactiveoutdoor.com, privacy policy of 10 July 2026) — confirm it is the entity that sells on this site.
 * ⚠️ Every remaining [BRACKETED] placeholder (registry number, EU VAT number, publication director, phone, consumer
 * mediator) needs the real value before launch, and a lawyer should review the texts (EU consumer law, GDPR, OSS VAT,
 * German Impressum duty). `npm run check:legal` in apps/web lists what is still missing.
 */
import type { Locale } from './i18n';

export type LegalPage = 'shipping' | 'returns' | 'terms' | 'privacy' | 'imprint';
type Doc = { title: string; sections: [string, string][] };

export const LEGAL: Record<Locale, Record<LegalPage, Doc>> = {
  en: {
    shipping: { title: 'Shipping & delivery', sections: [
      ['Where we deliver', 'We deliver exclusively within Europe: all 27 EU member states, the United Kingdom, Switzerland, Norway, Iceland, Liechtenstein, Monaco, Andorra and San Marino.'],
      ['Rates & delays', 'Zone 1 (FR, DE, BE, NL, LU, AT, MC): standard €5.90 — free from €79 — 2–4 business days; express €14.90.\nZone 2 (rest of the EU, Andorra, San Marino): standard €9.90 — free from €99 — 3–6 business days; express €19.90.\nZone 3 (UK, CH, NO, IS, LI): standard €19.90 — free from €199 — 4–8 business days; express €34.90.'],
      ['Duties outside the EU', 'Deliveries to the UK, Switzerland, Norway, Iceland and Liechtenstein are exports: EU VAT is not charged, but local import VAT and duties may be collected by the carrier on delivery.'],
      ['Tracking', 'As soon as your parcel ships you can follow it from your account or from the “Track order” page.'],
    ] },
    returns: { title: 'Returns & refunds', sections: [
      ['30-day returns', 'You can return any item within 30 days of delivery — longer than the 14-day legal withdrawal period. Items must be unused and in their original packaging.'],
      ['How to return', 'Contact us at info@reactiveoutdoor.com with your order number. We send you the return address and instructions.'],
      ['Refunds', 'Refunds are issued to the original payment method within 14 days of receiving the return.'],
      ['Legal guarantee', 'All products benefit from the 2-year EU legal guarantee of conformity, in addition to any manufacturer warranty.'],
    ] },
    terms: { title: 'Terms of sale', sections: [
      ['Seller', 'Reactive Commerce Limited, 111 Connaught Road Central, Room 1601, 16th Floor, Wing On Centre, Sheung Wan, Hong Kong; registration [REGISTRY / NUMBER]; VAT [EU VAT NUMBER].'],
      ['Prices', 'Prices are in euros, including VAT applicable in the delivery country (EU One-Stop-Shop), excluding shipping costs shown before payment.'],
      ['Order & payment', 'The contract is formed once payment is confirmed. Payments are processed by our payment service provider (cards, SEPA and local methods); we never store card data.'],
      ['Right of withdrawal', 'EU consumers have 14 days from delivery to withdraw without giving a reason (extended to 30 days by our returns policy).'],
      ['Disputes', 'Please contact us first at info@reactiveoutdoor.com; we will look for an amicable solution. Consumer mediator: [NAME, ADDRESS, WEBSITE]. Dispute resolution bodies by country: https://consumer-redress.ec.europa.eu/dispute-resolution-bodies.'],
    ] },
    privacy: { title: 'Privacy policy', sections: [
      ['Controller', 'Reactive Commerce Limited, 111 Connaught Road Central, Room 1601, 16th Floor, Wing On Centre, Sheung Wan, Hong Kong — info@reactiveoutdoor.com.'],
      ['Data we process', 'Account data (name, email, password hash), order and delivery data, payment status (handled by our PSP), newsletter subscription with consent timestamp.'],
      ['Purposes & legal basis', 'Performing your order (contract), legal accounting obligations, newsletter (consent, withdrawable anytime), fraud prevention (legitimate interest).'],
      ['Processors', 'Hosting (Vercel, Railway), payment (Adyen / Payoneer), carriers for delivery.'],
      ['Your rights', 'Access, rectification, erasure, portability, objection and complaint to your supervisory authority (GDPR arts. 15–22, 77).'],
    ] },
    imprint: { title: 'Legal notice', sections: [
      ['Publisher', 'Reactive Commerce Limited\n111 Connaught Road Central, Room 1601, 16th Floor, Wing On Centre, Sheung Wan, Hong Kong\nEmail: info@reactiveoutdoor.com · Phone: [+00 …]\nRegistry: [REGISTRY / NUMBER] · VAT: [EU VAT NUMBER]\nResponsible for content: [NAME]'],
      ['Hosting', 'Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, United States (frontend) and Railway Corporation, 548 Market St, Suite 68956, San Francisco, CA 94104, United States (API & database).'],
      ['Trademarks', 'Reactive Outdoor and Kilos Gear are brands owned by the publisher of this site.'],
    ] },
  },
  fr: {
    shipping: { title: 'Livraison', sections: [
      ['Zones desservies', 'Nous livrons uniquement en Europe : les 27 États membres de l’UE, le Royaume-Uni, la Suisse, la Norvège, l’Islande, le Liechtenstein, Monaco, Andorre et Saint-Marin.'],
      ['Tarifs & délais', 'Zone 1 (FR, DE, BE, NL, LU, AT, MC) : standard 5,90 € — offerte dès 79 € — 2 à 4 jours ouvrés ; express 14,90 €.\nZone 2 (reste de l’UE, Andorre, Saint-Marin) : standard 9,90 € — offerte dès 99 € — 3 à 6 jours ouvrés ; express 19,90 €.\nZone 3 (UK, CH, NO, IS, LI) : standard 19,90 € — offerte dès 199 € — 4 à 8 jours ouvrés ; express 34,90 €.'],
      ['Droits hors UE', 'Les livraisons au Royaume-Uni, en Suisse, Norvège, Islande et au Liechtenstein sont des exportations : la TVA européenne n’est pas facturée, mais la TVA et les droits d’importation locaux peuvent être perçus par le transporteur.'],
      ['Suivi', 'Dès l’expédition, suivez votre colis depuis votre compte ou la page « Suivre ma commande ».'],
    ] },
    returns: { title: 'Retours & remboursements', sections: [
      ['Retours sous 30 jours', 'Vous pouvez retourner un article dans les 30 jours suivant la livraison — au-delà du délai légal de rétractation de 14 jours. Les articles doivent être non utilisés et dans leur emballage d’origine.'],
      ['Procédure', 'Écrivez-nous à info@reactiveoutdoor.com avec votre numéro de commande ; nous vous envoyons l’adresse et les instructions de retour.'],
      ['Remboursement', 'Le remboursement est effectué sur le moyen de paiement initial sous 14 jours après réception du retour.'],
      ['Garantie légale', 'Tous les produits bénéficient de la garantie légale de conformité de 2 ans, en plus de la garantie fabricant.'],
    ] },
    terms: { title: 'Conditions générales de vente', sections: [
      ['Vendeur', 'Reactive Commerce Limited, 111 Connaught Road Central, Room 1601, 16th Floor, Wing On Centre, Sheung Wan, Hong Kong ; immatriculation [RCS / NUMÉRO] ; TVA [N° TVA INTRACOMMUNAUTAIRE].'],
      ['Prix', 'Prix en euros, TVA du pays de livraison incluse (guichet unique OSS), hors frais de livraison indiqués avant paiement.'],
      ['Commande & paiement', 'Le contrat est conclu à la confirmation du paiement. Les paiements sont traités par notre prestataire (cartes, SEPA, moyens locaux) ; nous ne stockons aucune donnée de carte.'],
      ['Droit de rétractation', 'Les consommateurs disposent de 14 jours à compter de la livraison pour se rétracter sans motif (porté à 30 jours par notre politique de retour).'],
      ['Litiges', 'Contactez-nous d’abord à info@reactiveoutdoor.com : nous cherchons une solution amiable. Médiateur de la consommation : [NOM, ADRESSE ET SITE DU MÉDIATEUR]. Organismes de règlement des litiges par pays : https://consumer-redress.ec.europa.eu/dispute-resolution-bodies.'],
    ] },
    privacy: { title: 'Politique de confidentialité', sections: [
      ['Responsable du traitement', 'Reactive Commerce Limited, 111 Connaught Road Central, Room 1601, 16th Floor, Wing On Centre, Sheung Wan, Hong Kong — info@reactiveoutdoor.com.'],
      ['Données traitées', 'Données de compte (nom, e-mail, mot de passe chiffré), données de commande et de livraison, statut de paiement (géré par notre PSP), inscription newsletter avec horodatage du consentement.'],
      ['Finalités & bases légales', 'Exécution de la commande (contrat), obligations comptables (obligation légale), newsletter (consentement, retirable à tout moment), prévention de la fraude (intérêt légitime).'],
      ['Sous-traitants', 'Hébergement (Vercel, Railway), paiement (Adyen / Payoneer), transporteurs.'],
      ['Vos droits', 'Accès, rectification, effacement, portabilité, opposition et réclamation auprès de la CNIL ou de votre autorité (RGPD art. 15 à 22, 77).'],
    ] },
    imprint: { title: 'Mentions légales', sections: [
      ['Éditeur', 'Reactive Commerce Limited\n111 Connaught Road Central, Room 1601, 16th Floor, Wing On Centre, Sheung Wan, Hong Kong\nE-mail : info@reactiveoutdoor.com · Tél. : [+00 …]\nImmatriculation : [RCS / NUMÉRO] · TVA : [N° TVA]\nDirecteur de la publication : [NOM]'],
      ['Hébergement', 'Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis (frontend) et Railway Corporation, 548 Market St, Suite 68956, San Francisco, CA 94104, États-Unis (API et base de données).'],
      ['Marques', 'Reactive Outdoor et Kilos Gear sont des marques appartenant à l’éditeur de ce site.'],
    ] },
  },
  de: {
    shipping: { title: 'Versand & Lieferung', sections: [
      ['Liefergebiet', 'Wir liefern ausschließlich innerhalb Europas: alle 27 EU-Mitgliedstaaten, Vereinigtes Königreich, Schweiz, Norwegen, Island, Liechtenstein, Monaco, Andorra und San Marino.'],
      ['Kosten & Lieferzeiten', 'Zone 1 (FR, DE, BE, NL, LU, AT, MC): Standard 5,90 € — kostenlos ab 79 € — 2–4 Werktage; Express 14,90 €.\nZone 2 (übrige EU, Andorra, San Marino): Standard 9,90 € — kostenlos ab 99 € — 3–6 Werktage; Express 19,90 €.\nZone 3 (UK, CH, NO, IS, LI): Standard 19,90 € — kostenlos ab 199 € — 4–8 Werktage; Express 34,90 €.'],
      ['Zölle außerhalb der EU', 'Lieferungen nach UK, Schweiz, Norwegen, Island und Liechtenstein sind Ausfuhren: Es wird keine EU-MwSt. berechnet, jedoch können Einfuhrumsatzsteuer und Zölle bei Zustellung anfallen.'],
      ['Sendungsverfolgung', 'Sobald dein Paket versendet ist, kannst du es in deinem Konto oder auf der Seite „Bestellung verfolgen“ verfolgen.'],
    ] },
    returns: { title: 'Rückgabe & Erstattung', sections: [
      ['30 Tage Rückgabe', 'Du kannst Artikel innerhalb von 30 Tagen nach Lieferung zurückgeben — länger als die gesetzliche Widerrufsfrist von 14 Tagen. Artikel müssen unbenutzt und originalverpackt sein.'],
      ['Ablauf', 'Schreib uns an info@reactiveoutdoor.com mit deiner Bestellnummer; wir senden dir Rücksendeadresse und Anleitung.'],
      ['Erstattung', 'Die Erstattung erfolgt innerhalb von 14 Tagen nach Eingang der Rücksendung über das ursprüngliche Zahlungsmittel.'],
      ['Gesetzliche Gewährleistung', 'Alle Produkte unterliegen der 2-jährigen gesetzlichen Gewährleistung, zusätzlich zu einer etwaigen Herstellergarantie.'],
    ] },
    terms: { title: 'Allgemeine Geschäftsbedingungen', sections: [
      ['Verkäufer', 'Reactive Commerce Limited, 111 Connaught Road Central, Room 1601, 16th Floor, Wing On Centre, Sheung Wan, Hongkong; Register [REGISTER / NUMMER]; USt-IdNr. [NUMMER].'],
      ['Preise', 'Preise in Euro inkl. der MwSt. des Lieferlandes (OSS-Verfahren), zzgl. der vor der Zahlung angezeigten Versandkosten.'],
      ['Bestellung & Zahlung', 'Der Vertrag kommt mit Bestätigung der Zahlung zustande. Zahlungen werden von unserem Zahlungsdienstleister abgewickelt (Karte, SEPA, lokale Zahlarten); wir speichern keine Kartendaten.'],
      ['Widerrufsrecht', 'Verbraucher können innerhalb von 14 Tagen ab Lieferung ohne Angabe von Gründen widerrufen (durch unsere Rückgaberichtlinie auf 30 Tage verlängert).'],
      ['Streitbeilegung', 'Bitte kontaktiere uns zuerst unter info@reactiveoutdoor.com. Verbraucherschlichtungsstelle: [NAME, ADRESSE, WEBSITE ODER ERKLÄRUNG ZUR NICHTTEILNAHME]. Streitbeilegungsstellen der Mitgliedstaaten: https://consumer-redress.ec.europa.eu/dispute-resolution-bodies.'],
    ] },
    privacy: { title: 'Datenschutzerklärung', sections: [
      ['Verantwortlicher', 'Reactive Commerce Limited, 111 Connaught Road Central, Room 1601, 16th Floor, Wing On Centre, Sheung Wan, Hongkong — info@reactiveoutdoor.com.'],
      ['Verarbeitete Daten', 'Kontodaten (Name, E-Mail, Passwort-Hash), Bestell- und Lieferdaten, Zahlungsstatus (über unseren Zahlungsdienstleister), Newsletter-Anmeldung mit Einwilligungszeitpunkt.'],
      ['Zwecke & Rechtsgrundlagen', 'Vertragserfüllung, gesetzliche Aufbewahrungspflichten, Newsletter (Einwilligung, jederzeit widerrufbar), Betrugsprävention (berechtigtes Interesse).'],
      ['Auftragsverarbeiter', 'Hosting (Vercel, Railway), Zahlung (Adyen / Payoneer), Versanddienstleister.'],
      ['Deine Rechte', 'Auskunft, Berichtigung, Löschung, Datenübertragbarkeit, Widerspruch und Beschwerde bei einer Aufsichtsbehörde (Art. 15–22, 77 DSGVO).'],
    ] },
    imprint: { title: 'Impressum', sections: [
      ['Angaben gemäß § 5 DDG', 'Reactive Commerce Limited\n111 Connaught Road Central, Room 1601, 16th Floor, Wing On Centre, Sheung Wan, Hongkong\nE-Mail: info@reactiveoutdoor.com · Telefon: [+00 …]\nRegister: [REGISTER / NUMMER] · USt-IdNr.: [NUMMER]\nVerantwortlich für den Inhalt: [NAME]'],
      ['Hosting', 'Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA (Frontend) und Railway Corporation, 548 Market St, Suite 68956, San Francisco, CA 94104, USA (API & Datenbank).'],
      ['Marken', 'Reactive Outdoor und Kilos Gear sind Marken, die dem Herausgeber dieser Website gehören.'],
    ] },
  },
};
