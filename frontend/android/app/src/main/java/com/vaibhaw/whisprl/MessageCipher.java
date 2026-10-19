package com.vaibhaw.whisprl;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

// the steps of messageCipher.js on the web, held to it by the vectors in messageVectors.json that both are tested against
final class MessageCipher {

    private static final byte[] MESSAGE_INFO = "whisprl message v1".getBytes(StandardCharsets.UTF_8);
    private static final int COORDINATE_BYTES = 32;
    private static final int TAG_BITS = 128;

    private MessageCipher() {}

    static byte[] pairKey(byte[] pkcs8, byte[] peerPublicKey, String conversationId) throws GeneralSecurityException {
        KeyFactory keys = KeyFactory.getInstance("EC");
        KeyAgreement agreement = KeyAgreement.getInstance("ECDH");
        agreement.init(keys.generatePrivate(new PKCS8EncodedKeySpec(pkcs8)));
        agreement.doPhase(publicKeyOf(keys, peerPublicKey), true);
        return hkdf(agreement.generateSecret(), conversationId.getBytes(StandardCharsets.UTF_8));
    }

    static byte[] open(byte[] key, byte[] iv, byte[] data, String context) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(TAG_BITS, iv));
        cipher.updateAAD(context.getBytes(StandardCharsets.UTF_8));
        return cipher.doFinal(data);
    }

    static String contextOf(String conversationId, String senderId) {
        return conversationId + ":" + senderId;
    }

    // the web exports a public key raw: a 0x04 byte, then the point's two coordinates
    private static PublicKey publicKeyOf(KeyFactory keys, byte[] raw) throws GeneralSecurityException {
        AlgorithmParameters curve = AlgorithmParameters.getInstance("EC");
        curve.init(new ECGenParameterSpec("secp256r1"));
        BigInteger pointX = new BigInteger(1, Arrays.copyOfRange(raw, 1, 1 + COORDINATE_BYTES));
        BigInteger pointY = new BigInteger(1, Arrays.copyOfRange(raw, 1 + COORDINATE_BYTES, raw.length));
        return keys.generatePublic(new ECPublicKeySpec(new ECPoint(pointX, pointY), curve.getParameterSpec(ECParameterSpec.class)));
    }

    // one block of SHA-256 output is exactly the 32 bytes an AES-256 key needs
    private static byte[] hkdf(byte[] secret, byte[] salt) throws GeneralSecurityException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(salt, "HmacSHA256"));
        byte[] pseudoRandomKey = mac.doFinal(secret);
        mac.init(new SecretKeySpec(pseudoRandomKey, "HmacSHA256"));
        mac.update(MESSAGE_INFO);
        mac.update((byte) 1);
        return mac.doFinal();
    }
}
