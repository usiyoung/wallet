# SOOHO IO WALLET

## **프로젝트 실행방법**

1.  **Node 버전 설정**

프로젝트 실행을 위해 Node.js `22.16.0` 버전을 사용합니다.

```bash
nvm use 22.16.0
```

2.  **종속성 설치**

```bash
npm install
```

3.  **프로젝트 빌드**

익스텐션 지갑을 확인하려면 번들링된 파일이 필요합니다.

```bash
npm run build
```

4.  **크롬 확장 프로그램 로드**

- Chrome 브라우저에서 `chrome://extensions/`로 이동합니다.
- `개발자 모드`를 활성화합니다.
- `압축해제된 확장 프로그램을 로드` 버튼을 클릭합니다.
- 프로젝트 루트에 생성된 `dist` 폴더를 선택합니다.



## **사용된 기술 스택**

| 구분          | 기술                                                      | 핵심 역할                                                                                                                              |
| ------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Core**      | `React`, `TypeScript`, `Vite`                             | **Vite** 기반의 빠른 개발 환경에서 **TypeScript**를 통해 타입 안정성을 확보하고 **React**로 반응형 UI를 구축.                          |
| **State**     | `Redux Toolkit`, `React-Redux`                            | **Redux Toolkit**을 활용하여 복잡한 지갑 상태(계정, 잔액, 트랜잭션 등)를 중앙에서 예측 가능하게 관리.                                  |
| **Styling**   | `Tailwind CSS`, `PostCSS`                                 | **Tailwind CSS**의 Utility-First 접근법을 통해 일관성 있는 디자인 시스템을 신속하게 구축.                                              |
| **Crypto**    | `@noble/secp256k1`, `@scure/bip39`, `elliptic`            | **BIP39** 니모닉, **secp256k1** 키 생성 및 서명 등 지갑의 핵심 암호화 기능을 안정성이 검증된 라이브러리로 구현.                        |
| **Dev Tools** | `vite-plugin-web-extension`, `vite-plugin-node-polyfills` | Vite 환경에서 웹 확장 프로그램 개발을 용이하게 하고, `crypto`, `buffer` 등 Node.js 모듈을 브라우저에서 사용하도록 **Polyfill**을 설정. |



## **AI 활용 사용법**

1.  **프로젝트 보일러 플레이트**

```
Vite, React, TypeScript를 사용하여 크롬 브라우저 확장 프로그램의 초기 프로젝트 설정을 해줘.

다음 요구사항을 반드시 포함해 줘

Vite 설정: vite-plugin-node-polyfills 플러그인을 사용하여 Buffer와 crypto 같은 Node 모듈을 폴리필해줘.

TypeScript 설정: React 개발에 필요한 tsconfig.json과 Vite 설정을 위한 tsconfig.node.json을 생성해줘.

매니페스트 파일: 기본적인 popup과 background 스크립트를 포함하는 Manifest V3 버전의 manifest.json 파일을 생성해줘.
```

2.  **파일 구조 생성**

```
(파일구조 스니펫 첨부)
다음 파일 구조를 생성하고, 각 파일의 타입에 맞는 기본 코드를 초기화해줘.
.ts 파일은 비어있는 함수나 클래스로 초기화해줘.
.tsx 파일은 기본 React 함수형 컴포넌트 코드로 초기화해줘.
```

3.  **커밋 메시지 작성**

```
git diff 내용을 바탕으로 아래의 구조로 커밋해줘

  feat: 기능 설명

  - 상세설명1
  - 상세설명2
  - 상세설명3
```

4.  **API 명세 기반 타입 정의**

```
이 API의 엔드포인트는 `/send`, 리퀘스트 형식은 `{ from: string, to: string, amount: number }`, 응답값은 `{ txId: string, status: 'pending' | 'success' }`이야. 이걸 기반으로 TypeScript 타입을 각각 정의해 줘.
```
