package com.happypath.util;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Locale;
import java.util.Map;

/**
 * Validatore del Codice Fiscale italiano.
 * Controlla:
 *  1. Formato (lunghezza 16, charset ammessi)
 *  2. Carattere di controllo (CIN)
 *  3. Coerenza con nome, cognome, data di nascita e genere forniti dall'utente
 *
 * Non viene verificato il codice catastale del comune di nascita perché
 * richiederebbe un database esterno; il campo birthPlace viene conservato
 * per revisione manuale da parte del moderatore.
 */
public final class CodiceFiscaleValidator {

    private CodiceFiscaleValidator() {}

    // ── Tabelle per il calcolo del CIN ──────────────────────────────────────
    private static final int[] ODD  = {1,0,5,7,9,13,15,17,19,21,2,4,18,20,11,3,6,8,12,14,16,10,22,25,24,23};
    private static final Map<Character, Integer> EVEN = buildEven();

    private static Map<Character, Integer> buildEven() {
        String chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var m = new java.util.HashMap<Character, Integer>();
        for (int i = 0; i < chars.length(); i++) m.put(chars.charAt(i), i);
        return m;
    }

    // ── Mesi (codice fiscale) ────────────────────────────────────────────────
    private static final char[] MONTHS = {'A','B','C','D','E','H','L','M','P','R','S','T'};

    // ─────────────────────────────────────────────────────────────────────────

    /** Valida formato + CIN */
    public static boolean isValidFormat(String cf) {
        if (cf == null) return false;
        String s = cf.toUpperCase().trim();
        if (s.length() != 16) return false;
        if (!s.matches("[A-Z0-9]{16}")) return false;
        return checkCin(s);
    }

    /**
     * Controlla coerenza del CF con i dati anagrafici forniti.
     * Restituisce true se CF è formalmente valido E coerente con
     * cognome, nome, data di nascita e genere.
     */
    public static boolean isCoherent(
            String cf,
            String lastName,
            String firstName,
            LocalDate birthDate,
            String gender // "M" o "F"
    ) {
        if (!isValidFormat(cf)) return false;
        String s = cf.toUpperCase().trim();

        return surnameCode(lastName).equals(s.substring(0, 3))
            && nameCode(firstName).equals(s.substring(3, 6))
            && birthCode(birthDate, gender).equals(s.substring(6, 11));
    }

    // ── Calcolo CIN ─────────────────────────────────────────────────────────

    private static boolean checkCin(String cf) {
        int sum = 0;
        for (int i = 0; i < 15; i++) {
            char c = cf.charAt(i);
            int v = Character.isDigit(c) ? (c - '0') : (c - 'A');
            sum += ((i % 2) == 0) ? ODD[v] : EVEN.get(c);
        }
        return (char) ('A' + (sum % 26)) == cf.charAt(15);
    }

    // ── Codice cognome ───────────────────────────────────────────────────────

    private static String surnameCode(String surname) {
        String cons = consonants(normalize(surname));
        String vow  = vowels(normalize(surname));
        String raw  = cons + vow + "XXX";
        return raw.substring(0, 3).toUpperCase();
    }

    // ── Codice nome ─────────────────────────────────────────────────────────

    private static String nameCode(String name) {
        String cons = consonants(normalize(name));
        if (cons.length() >= 4) {
            return ("" + cons.charAt(0) + cons.charAt(2) + cons.charAt(3)).toUpperCase();
        }
        String vow = vowels(normalize(name));
        String raw = cons + vow + "XXX";
        return raw.substring(0, 3).toUpperCase();
    }

    // ── Codice data + genere ─────────────────────────────────────────────────

    private static String birthCode(LocalDate date, String gender) {
        int yy   = date.getYear() % 100;
        char mm  = MONTHS[date.getMonthValue() - 1];
        int day  = date.getDayOfMonth();
        if ("F".equalsIgnoreCase(gender)) day += 40;
        return String.format("%02d%c%02d", yy, mm, day);
    }

    // ── Utility ──────────────────────────────────────────────────────────────

    private static String normalize(String s) {
        return s == null ? "" :
               java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
                   .replaceAll("[^a-zA-Z]", "").toUpperCase();
    }

    private static String consonants(String s) {
        return s.chars()
                .filter(c -> "BCDFGHJKLMNPQRSTVWXYZ".indexOf(c) >= 0)
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString();
    }

    private static String vowels(String s) {
        return s.chars()
                .filter(c -> "AEIOU".indexOf(c) >= 0)
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString();
    }
}
