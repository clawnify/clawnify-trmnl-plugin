# frozen_string_literal: true

require 'json'

RSpec.describe 'Clawnify app display' do
  let(:sample) { JSON.parse(File.read(File.expand_path('../preview/sample.json', __dir__))) }
  let(:custom_fields) { { display_key: 'cdsp_test_value_only' } }
  let(:mocks) { { 'https://provision.clawnify.com/displays/trmnl' => { json: sample } } }
  let(:now) { '2026-11-09T16:50:00Z' }

  it_behaves_like 'a publishable recipe'

  %w[og_plus v2].each do |device|
    %w[full half_horizontal half_vertical quadrant].each do |view|
      it "fits #{view} on #{device}" do
        screen = trmnl.render(view:, device:, mocks:, custom_fields:, now:)
        expect(screen).to have_text('€42,850')
        expect(screen).to have_no_overflow
        expect(screen).to have_no_problems
      end
    end
  end

  it 'escapes app-authored markup and excludes unselected fields and credentials' do
    sample['name'] = '<script>alert(1)</script>'
    sample['widgets'][0]['title'] = '<img src=x onerror=alert(1)>'
    screen = trmnl.render(data: sample, custom_fields:, now:)
    expect(screen).to have_text('<script>alert(1)</script>')
    expect(screen).to have_text('<img src=x onerror=alert(1)>')
    expect(screen).not_to have_css('img[src="x"]')
    expect(screen).not_to have_text('cdsp_test_value_only')
    expect(screen).to have_no_problems
  end

  it 'renders a failure without fabricating data when the feed rejects a connection' do
    screen = trmnl.render(mocks: { 'https://provision.clawnify.com/displays/trmnl' => { status: 403, json: { error: 'Connection revoked' } } }, custom_fields:, now:)
    expect(screen).to have_text('Display unavailable')
    expect(screen).not_to have_text('€42,850')
    expect(screen).to have_no_problems
  end
end
