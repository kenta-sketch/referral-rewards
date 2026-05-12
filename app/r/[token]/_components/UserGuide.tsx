export function UserGuide({
  isCloser,
  isPayer,
}: {
  isCloser: boolean;
  isPayer: boolean;
}) {
  return (
    <details className="card mb-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
      <summary className="cursor-pointer list-none px-5 py-4">
        <span className="inline-flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-base">
            ?
          </span>
          <span>
            <span className="font-semibold text-blue-900">このページの使い方ガイド</span>
            <span className="text-xs text-gray-500 ml-2">クリックで開閉</span>
          </span>
        </span>
      </summary>

      <div className="border-t border-blue-200 px-5 py-5 space-y-6 text-sm">
        {/* 共通 */}
        <Section step="1" title="まず最初に：基本受取方式を選びましょう">
          <p>
            このページ上部の「<b>あなたの基本受取方式</b>」で、報酬の受取り方を選びます。
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <b>即時受取（税込）</b>：通常の支払い方法。案件確定後に管理者から振り込まれます。
            </li>
            <li>
              <b>繰延受取（×3・翌年以降）</b>：受取りを翌年以降にする代わりに、金額が
              <b>3倍</b>になります。
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            ※ 切り替えると、未払い／支払予定の配分もすべて新しい方式に自動で切り替わります（支払済みは保護）。
          </p>
        </Section>

        <Section step="2" title="新しい案件を紹介したら「トスアップ」を登録">
          <p>
            画面右上の <b>「+ 案件をトスアップ」</b> ボタンを押して、紹介先と予定人数を入力。
          </p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>紹介先（会社名や個人名）を入力</li>
            <li>予定人数（わかる範囲でOK、未定なら空欄でも可）</li>
            <li>メモ（紹介経緯や先方担当者など、任意）</li>
            <li>「トスアップを登録」を押す</li>
          </ol>
          <p className="text-xs text-gray-500 mt-2">
            登録した案件はクロージング担当者が打ち合わせ調整→確定処理を行います。
          </p>
        </Section>

        <Section step="3" title="サマリーカードを読む">
          <p>ページ上部のカードで、確定済みの報酬と見込み報酬が見られます。</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <b>あなたが選択した受取総額</b>：確定済み案件で、あなたの選んだ受取方式（即時 or
              繰延）で集計した合計
            </li>
            <li>
              <b>見込み（青いカード）</b>：まだ確定前のトスアップ案件で「もしこのまま確定したら入る予定の金額」。あなたの取り分（階層比率）が反映済み
            </li>
            <li>
              <b>未払い／支払予定／支払済</b>：支払いステータスごとの内訳
            </li>
          </ul>
        </Section>

        <Section step="4" title="「あなたへの配分」テーブルで案件ごとの取り分を確認">
          <p>確定した案件ごとに、あなたへの配分金額と階層比率が並びます。</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <b>即時（税込）／繰延（×3）</b>：両方の金額が表示され、現在選択中の方が太字でハイライト
            </li>
            <li>
              <b>受取方式の右側ドロップダウン</b>：案件単位で「この案件だけ繰延にしたい」など個別に切り替え可能（支払済みは変更不可）
            </li>
            <li>
              <b>支払い列</b>：未払い／支払予定／支払済の状態と日付
            </li>
          </ul>
        </Section>

        <Section step="5" title="あなたがトスアップした案件 ＆ 配下のトスアップ案件">
          <p>
            <b>「あなたがトスアップした案件」</b>はご自身が登録した案件の進捗。打ち合わせ日とクローザー名、ステータスがわかります。
          </p>
          <p className="mt-2">
            <b>「配下メンバーのトスアップ案件」</b>はあなたの紹介ツリーの配下メンバーが登録した案件。あなたへの取り分（25%や12.5%など）も併記されます。
          </p>
        </Section>

        <Section step="6" title="単価ルール">
          <table className="w-full text-xs mt-2 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 border border-gray-200">実施人数</th>
                <th className="px-2 py-1 border border-gray-200">即時（税込）</th>
                <th className="px-2 py-1 border border-gray-200">繰延（×3）</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-1 border border-gray-200">49名まで</td>
                <td className="px-2 py-1 border border-gray-200">18万円 / 1人</td>
                <td className="px-2 py-1 border border-gray-200">54万円 / 1人</td>
              </tr>
              <tr>
                <td className="px-2 py-1 border border-gray-200">50名以上</td>
                <td className="px-2 py-1 border border-gray-200">20万円 / 1人</td>
                <td className="px-2 py-1 border border-gray-200">60万円 / 1人</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-500 mt-2">
            50名を超えると全員分の単価が20万円に上がります（境目で大きく変わるので意識しておくと得です）。
          </p>
        </Section>

        <Section step="7" title="階層別の取り分">
          <p>紹介ツリーの位置によって、案件総額に対するあなたの取り分が決まります。</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <b>ツリーの頂点</b>：常に <b>50%</b>（最下層がトスアップした場合）
            </li>
            <li>
              <b>トスアップ者（最下層）</b>：常に <b>25%</b>（直接紹介者なら50%または100%）
            </li>
            <li>
              <b>中間層</b>：残り 25% を等分
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            例：第3階層がトスアップ →トスアップ者25% / 中間層（親）25% / 頂点 50%。<br />
            例：第4階層がトスアップ → トスアップ者25% / 中間層2人で 12.5%ずつ / 頂点 50%。
          </p>
        </Section>

        {/* クロージング担当者 */}
        {isCloser && (
          <div className="pt-5 border-t-2 border-dashed border-purple-300">
            <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
              <span className="badge bg-purple-100 text-purple-800">クロージング担当者の追加機能</span>
            </h3>

            <Section step="A" title="「クロージング管理」ボタンから全案件を管理">
              <p>
                マイページ右上の <b>「クロージング管理」</b> ボタンを押すと、全担当者がトスアップした案件の一覧画面に入れます。
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <b>打ち合わせ予定（直近）</b>：これから対応する案件。打合せ日が未設定のものも含む
                </li>
                <li>
                  <b>打ち合わせ日経過（要対応）</b>：打合せ日を過ぎても確定していない案件（要確認）
                </li>
                <li>
                  <b>確定済み</b>：配分計算が完了した案件
                </li>
                <li>
                  <b>キャンセル</b>：取り止めになった案件
                </li>
              </ul>
            </Section>

            <Section step="B" title="案件ごとに「この案件を操作する」で展開">
              <p>
                各案件カードの黒い <b>「この案件を操作する」</b> ボタンを押すと、3つの操作パネルが開きます。
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <b>打ち合わせ日を更新</b>（青）：打合せ予定日を入力して「日付を保存」
                </li>
                <li>
                  <b>確定（配分計算）</b>（緑）：打合せ後、実施人数を入れて「確定して配分計算」。配分が自動で生成され、各担当者のマイページに反映
                </li>
                <li>
                  <b>キャンセル</b>（赤い小ボタン）：案件取り止め
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                ※ 50名を境に単価が変わるので、ボーダー前後は事前に共有を。
              </p>
            </Section>
          </div>
        )}

        {/* 支払い担当者 */}
        {isPayer && (
          <div className="pt-5 border-t-2 border-dashed border-emerald-300">
            <h3 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
              <span className="badge bg-emerald-100 text-emerald-800">支払い担当者の追加機能</span>
            </h3>

            <Section step="A" title="「支払い管理」ボタンから支払い一覧へ">
              <p>
                マイページ右上の <b>「支払い管理」</b> ボタンから支払い管理画面に入れます。担当者ごとに支払金額がグループ化された一覧が表示されます。
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  画面上部に <b>未払い／支払予定／支払済</b> の全体合計
                </li>
                <li>
                  各担当者カードを展開すると案件ごとの明細
                </li>
                <li>
                  受取方式（即時／繰延）が反映された <b>実際に支払うべき金額</b> が表示
                </li>
              </ul>
            </Section>

            <Section step="B" title="ステータス更新の手順">
              <p>各案件の右の <b>「更新」</b> をクリックして展開、以下を入力して「保存」。</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <b>ステータス</b>：未払い → 支払予定 → 支払済 の流れで進めます
                </li>
                <li>
                  <b>予定日／完了日</b>：振込予定日や実際の振込日
                </li>
                <li>
                  <b>メモ</b>：振込番号や注意事項など（任意）
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                ※ 担当者が「未払い」のときは受取方式（即時／繰延）を変更可能。「支払済」にすると以降は金額・方式とも固定されます。
              </p>
            </Section>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
          <p>
            ❓ 困ったとき：URL紛失・流出、配分金額の疑問、システム不具合などは管理者までご連絡ください。
          </p>
        </div>
      </div>
    </details>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
          {step}
        </span>
        {title}
      </h3>
      <div className="text-gray-700 leading-relaxed pl-8">{children}</div>
    </div>
  );
}
