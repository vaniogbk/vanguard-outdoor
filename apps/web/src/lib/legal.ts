/**
 * Legal page templates. ⚠️ Replace every [BRACKETED] placeholder with your real company details and have
 * the texts reviewed by a lawyer before launch (EU consumer law, GDPR, OSS VAT, German Impressum duty).
 */
import type { Locale } from './i18n';

export type LegalPage = 'shipping' | 'returns' | 'terms' | 'privacy' | 'imprint';
type Doc = { title: string; sections: [string, string][] };

export const LEGAL: Record<Locale, Record<LegalPage, Doc>> = {
  en: {
    shipping: { title: 'Shipping & delivery', sections: [
      ['Where we deliver', 'We deliver exclusively within Europe: all 27 EU member states, the United Kingdom, Switzerland, Norway, Iceland, Liechtenstein, Monaco, Andorra and San Marino.'],
      ['Rates & delays', 'Zone 1 (FR, DE, BE, NL, LU, AT): standard €5.90 — free from €79 — 2–4 business days; express €14.90.\nZone 2 (rest of the EU): standard €9.90 — free from €99 — 3–6 business days; express €19.90.\nZone 3 (UK, CH, NO, IS, LI): standard €19.90 — free from €199 — 4–8 business days; express €34.90.'],
      ['Duties outside the EU', 'Deliveries to the UK, Switzerland, Norway, Iceland and Liechtenstein are exports: EU VAT is not charged, but local import VAT and duties may be collected by the carrier on delivery.'],
      ['Tracking', 'As soon as your parcel ships you can follow it from your account or from the “Track order” page.'],
    ] },
    returns: { title: 'Returns & refunds', sections: [
      ['30-day returns', 'You can return any item within 30 days of delivery — longer than the 14-day legal withdrawal period. Items must be unused and in their original packaging.'],
      ['How to return', 'Contact us at [support@your-domain.eu] with your order number. We send you the return address and instructions.'],
      ['Refunds', 'Refunds are issued to the original payment method within 14 days of receiving the return.'],
      ['Legal guarantee', 'All products benefit from the 2-year EU legal guarantee of conformity, in addition to any manufacturer warranty.'],
    ] },
    terms: { title: 'Terms of sale', sections: [
      ['Seller', '[COMPANY LEGAL NAME], [legal form], [registered address], registration [REGISTRY / NUMBER], VAT [EU VAT NUMBER].'],
      ['Prices', 'Prices are in euros, including VAT applicable in the delivery country (EU One-Stop-Shop), excluding shipping costs shown before payment.'],
      ['Order & payment', 'The contract is formed once payment is confirmed. Payments are processed by our payment service provider (cards, SEPA and local methods); we never store card data.'],
      ['Right of withdrawal', 'EU consumers have 14 days from delivery to withdraw without giving a reason (extended to 30 days by our returns policy).'],
      ['Disputes', 'EU online dispute resolution platform: https://ec.europa.eu/consumers/odr.'],
    ] },
    privacy: { title: 'Privacy policy', sections: [
      ['Controller', '[COMPANY LEGAL NAME], [address], [privacy@your-domain.eu].'],
      ['Data we process', 'Account data (name, email, password hash), order and delivery data, payment status (handled by our PSP), newsletter subscription with consent timestamp.'],
      ['Purposes & legal basis', 'Performing your order (contract), legal accounting obligations, newsletter (consent, withdrawable anytime), fraud prevention (legitimate interest).'],
      ['Processors', 'Hosting (Vercel, Railway), payment (Adyen / Payoneer), carriers for delivery.'],
      ['Your rights', 'Access, rectification, erasure, portability, objection and complaint to your supervisory authority (GDPR arts. 15–22, 77).'],
    ] },
    imprint: { title: 'Legal notice', sections: [
      ['Publisher', '[COMPANY LEGAL NAME]\n[Street, postal code, city, country]\nEmail: [contact@your-domain.eu] · Phone: [+00 …]\nRegistry: [REGISTRY / NUMBER] · VAT: [EU VAT NUMBER]\nResponsible for content: [NAME]'],
      ['Hosting', 'Vercel Inc. (frontend) and Railway Corp. (API & database).'],
      ['Trademarks', 'Reactive Outdoor and Kilos Gear are trademarks of their respective owners, used with authorisation.'],
    ] },
  },
  fr: {
    shipping: { title: 'Livraison', sections: [
      ['Zones desservies', 'Nous livrons uniquement en Europe : les 27 États membres de l’UE, le Royaume-Uni, la Suisse, la Norvège, l’Islande, le Liechtenstein, Monaco, Andorre et Saint-Marin.'],
      ['Tarifs & délais', 'Zone 1 (FR, DE, BE, NL, LU, AT) : standard 5,90 € — offerte dès 79 € — 2 à 4 jours ouvrés ; express 14,90 €.\nZone 2 (reste de l’UE) : standard 9,90 € — offerte dès 99 € — 3 à 6 jours ouvrés ; express 19,90 €.\nZone 3 (UK, CH, NO, IS, LI) : standard 19,90 € — offerte dès 199 € — 4 à 8 jours ouvrés ; express 34,90 €.'],
      ['Droits hors UE', 'Les livraisons au Royaume-Uni, en Suisse, Norvège, Islande et au Liechtenstein sont des exportations : la TVA européenne n’est pas facturée, mais la TVA et les droits d’importation locaux peuvent être perçus par le transporteur.'],
      ['Suivi', 'Dès l’expédition, suivez votre colis depuis votre compte ou la page « Suivre ma commande ».'],
    ] },
    returns: { title: 'Retours & remboursements', sections: [
      ['Retours sous 30 jours', 'Vous pouvez retourner un article dans les 30 jours suivant la livraison — au-delà du délai légal de rétractation de 14 jours. Les articles doivent être non utilisés et dans leur emballage d’origine.'],
      ['Procédure', 'Écrivez-nous à [support@votre-domaine.eu] avec votre numéro de commande ; nous vous envoyons l’adresse et les instructions de retour.'],
      ['Remboursement', 'Le remboursement est effectué sur le moyen de paiement initial sous 14 jours après réception du retour.'],
      ['Garantie légale', 'Tous les produits bénéficient de la garantie légale de conformité de 2 ans, en plus de la garantie fabricant.'],
    ] },
    terms: { title: 'Conditions générales de vente', sections: [
      ['Vendeur', '[RAISON SOCIALE], [forme juridique], [adresse du siège], immatriculée [RCS / NUMÉRO], TVA [N° TVA INTRACOMMUNAUTAIRE].'],
      ['Prix', 'Prix en euros, TVA du pays de livraison incluse (guichet unique OSS), hors frais de livraison indiqués avant paiement.'],
      ['Commande & paiement', 'Le contrat est conclu à la confirmation du paiement. Les paiements sont traités par notre prestataire (cartes, SEPA, moyens locaux) ; nous ne stockons aucune donnée de carte.'],
      ['Droit de rétractation', 'Les consommateurs disposent de 14 jours à compter de la livraison pour se rétracter sans motif (porté à 30 jours par notre politique de retour).'],
      ['Litiges', 'Plateforme européenne de règlement en ligne des litiges : https://ec.europa.eu/consumers/odr.'],
    ] },
    privacy: { title: 'Politique de confidentialité', sections: [
      ['Responsable du traitement', '[RAISON SOCIALE], [adresse], [privacy@votre-domaine.eu].'],
      ['Données traitées', 'Données de compte (nom, e-mail, mot de passe chiffré), données de commande et de livraison, statut de paiement (géré par notre PSP), inscription newsletter avec horodatage du consentement.'],
      ['Finalités & bases légales', 'Exécution de la commande (contrat), obligations comptables (obligation légale), newsletter (consentement, retirable à tout moment), prévention de la fraude (intérêt légitime).'],
      ['Sous-traitants', 'Hébergement (Vercel, Railway), paiement (Adyen / Payoneer), transporteurs.'],
      ['Vos droits', 'Accès, rectification, effacement, portabilité, opposition et réclamation auprès de la CNIL ou de votre autorité (RGPD art. 15 à 22, 77).'],
    ] },
    imprint: { title: 'Mentions légales', sections: [
      ['Éditeur', '[RAISON SOCIALE]\n[Adresse complète]\nE-mail : [contact@votre-domaine.eu] · Tél. : [+00 …]\nImmatriculation : [RCS / NUMÉRO] · TVA : [N° TVA]\nDirecteur de la publication : [NOM]'],
      ['Hébergement', 'Vercel Inc. (frontend) et Railway Corp. (API et base de données).'],
      ['Marques', 'Reactive Outdoor et Kilos Gear sont des marques de leurs propriétaires respectifs, utilisées avec autorisation.'],
    ] },
  },
  de: {
    shipping: { title: 'Versand & Lieferung', sections: [
      ['Liefergebiet', 'Wir liefern ausschließlich innerhalb Europas: alle 27 EU-Mitgliedstaaten, Vereinigtes Königreich, Schweiz, Norwegen, Island, Liechtenstein, Monaco, Andorra und San Marino.'],
      ['Kosten & Lieferzeiten', 'Zone 1 (FR, DE, BE, NL, LU, AT): Standard 5,90 € — kostenlos ab 79 € — 2–4 Werktage; Express 14,90 €.\nZone 2 (übrige EU): Standard 9,90 € — kostenlos ab 99 € — 3–6 Werktage; Express 19,90 €.\nZone 3 (UK, CH, NO, IS, LI): Standard 19,90 € — kostenlos ab 199 € — 4–8 Werktage; Express 34,90 €.'],
      ['Zölle außerhalb der EU', 'Lieferungen nach UK, Schweiz, Norwegen, Island und Liechtenstein sind Ausfuhren: Es wird keine EU-MwSt. berechnet, jedoch können Einfuhrumsatzsteuer und Zölle bei Zustellung anfallen.'],
      ['Sendungsverfolgung', 'Sobald dein Paket versendet ist, kannst du es in deinem Konto oder auf der Seite „Bestellung verfolgen“ verfolgen.'],
    ] },
    returns: { title: 'Rückgabe & Erstattung', sections: [
      ['30 Tage Rückgabe', 'Du kannst Artikel innerhalb von 30 Tagen nach Lieferung zurückgeben — länger als die gesetzliche Widerrufsfrist von 14 Tagen. Artikel müssen unbenutzt und originalverpackt sein.'],
      ['Ablauf', 'Schreib uns an [support@deine-domain.eu] mit deiner Bestellnummer; wir senden dir Rücksendeadresse und Anleitung.'],
      ['Erstattung', 'Die Erstattung erfolgt innerhalb von 14 Tagen nach Eingang der Rücksendung über das ursprüngliche Zahlungsmittel.'],
      ['Gesetzliche Gewährleistung', 'Alle Produkte unterliegen der 2-jährigen gesetzlichen Gewährleistung, zusätzlich zu einer etwaigen Herstellergarantie.'],
    ] },
    terms: { title: 'Allgemeine Geschäftsbedingungen', sections: [
      ['Verkäufer', '[FIRMENNAME], [Rechtsform], [Sitz], Register [REGISTER / NUMMER], USt-IdNr. [NUMMER].'],
      ['Preise', 'Preise in Euro inkl. der MwSt. des Lieferlandes (OSS-Verfahren), zzgl. der vor der Zahlung angezeigten Versandkosten.'],
      ['Bestellung & Zahlung', 'Der Vertrag kommt mit Bestätigung der Zahlung zustande. Zahlungen werden von unserem Zahlungsdienstleister abgewickelt (Karte, SEPA, lokale Zahlarten); wir speichern keine Kartendaten.'],
      ['Widerrufsrecht', 'Verbraucher können innerhalb von 14 Tagen ab Lieferung ohne Angabe von Gründen widerrufen (durch unsere Rückgaberichtlinie auf 30 Tage verlängert).'],
      ['Streitbeilegung', 'OS-Plattform der EU-Kommission: https://ec.europa.eu/consumers/odr.'],
    ] },
    privacy: { title: 'Datenschutzerklärung', sections: [
      ['Verantwortlicher', '[FIRMENNAME], [Adresse], [privacy@deine-domain.eu].'],
      ['Verarbeitete Daten', 'Kontodaten (Name, E-Mail, Passwort-Hash), Bestell- und Lieferdaten, Zahlungsstatus (über unseren Zahlungsdienstleister), Newsletter-Anmeldung mit Einwilligungszeitpunkt.'],
      ['Zwecke & Rechtsgrundlagen', 'Vertragserfüllung, gesetzliche Aufbewahrungspflichten, Newsletter (Einwilligung, jederzeit widerrufbar), Betrugsprävention (berechtigtes Interesse).'],
      ['Auftragsverarbeiter', 'Hosting (Vercel, Railway), Zahlung (Adyen / Payoneer), Versanddienstleister.'],
      ['Deine Rechte', 'Auskunft, Berichtigung, Löschung, Datenübertragbarkeit, Widerspruch und Beschwerde bei einer Aufsichtsbehörde (Art. 15–22, 77 DSGVO).'],
    ] },
    imprint: { title: 'Impressum', sections: [
      ['Angaben gemäß § 5 DDG', '[FIRMENNAME]\n[Straße, PLZ, Ort, Land]\nE-Mail: [kontakt@deine-domain.eu] · Telefon: [+00 …]\nRegister: [REGISTER / NUMMER] · USt-IdNr.: [NUMMER]\nVerantwortlich für den Inhalt: [NAME]'],
      ['Hosting', 'Vercel Inc. (Frontend) und Railway Corp. (API & Datenbank).'],
      ['Marken', 'Reactive Outdoor und Kilos Gear sind Marken ihrer jeweiligen Inhaber und werden mit Genehmigung verwendet.'],
    ] },
  },
};
