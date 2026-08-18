# 📱 bancada. — do código ao TestFlight e à App Store

## Pré-requisitos (uma vez)

1. **Apple Developer Program** — https://developer.apple.com/programs/enroll/ (99 US$/ano).
   Inscreve-te com o teu Apple ID. A aprovação demora de minutos a ~48h.
2. **Conta Expo** (grátis) — https://expo.dev/signup
3. **EAS CLI** no Mac:
   ```bash
   npm install -g eas-cli
   eas login
   ```

## 1. Configurar o projeto (uma vez)

```bash
cd ~/Downloads/bancada/apps/mobile
eas init          # cria o projectId da Expo e liga-o ao app.json
```

## 2. Build de produção (na nuvem — não precisas de Xcode)

```bash
eas build --platform ios --profile production
```

- Na primeira vez pergunta se queres que a EAS faça a gestão de credenciais:
  responde **Yes** e inicia sessão com o teu Apple ID — ela cria e gere os
  certificados e provisioning profiles sozinha.
- O build demora ~10–20 min na nuvem. No fim dá-te um link para o .ipa.

## 3. Enviar para o TestFlight

```bash
eas submit --platform ios --latest
```

- Na primeira vez, a EAS cria a app no App Store Connect por ti
  (bundle id `app.bancada.mobile`, nome "bancada.").
- 10–30 min depois, o build aparece em **App Store Connect → a tua app →
  TestFlight** (fica "Processing" até a Apple o processar).

## 4. Instalar no iPhone

1. Instala a app **TestFlight** da App Store no iPhone.
2. Em App Store Connect → TestFlight → Internal Testing, cria um grupo e
   adiciona o teu email de Apple ID como tester.
3. Recebes um convite → abres no TestFlight → **Install**. 🎉
   A partir daqui, cada `eas build` + `eas submit` novo aparece
   automaticamente no TestFlight (o número de build auto-incrementa).

## 5. Publicar na App Store (quando estiveres pronto)

Em App Store Connect, na página da app:
- Preenche a ficha: descrição, palavras-chave, categoria (Desporto),
  screenshots (tira-os no simulador ou no iPhone), ícone (já vai no build).
- **URL de política de privacidade** (obrigatório) — podemos criar uma
  página /privacidade no site.
- Preenche o questionário de privacidade de dados (a app não recolhe
  dados pessoais na versão atual → "Data Not Collected").
- Submete para revisão. A Apple demora normalmente 1–2 dias.

## ⚠️ Antes do lançamento comercial

- **Dados**: a app usa a API pública da ESPN (não-oficial, sem SLA).
  Para vender premium com confiança, licenciar um fornecedor oficial
  (API-Football/SportMonks) — a arquitetura já o suporta.
- **Android**: o mesmo fluxo com `--platform android` + conta Google Play
  (25 US$ uma única vez).

## Atualizações do dia-a-dia

Mudanças só de JavaScript podem ser publicadas **sem passar pela Apple**
com EAS Update (over-the-air): `eas update --branch production`.
Builds novos só são precisos quando mudam dependências nativas.
