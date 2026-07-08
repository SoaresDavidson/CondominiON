# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_07_08_172308) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "agenda_items", force: :cascade do |t|
    t.bigint "meeting_id", null: false
    t.string "title", null: false
    t.text "description"
    t.string "attachment_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "position", default: 1, null: false
    t.index ["meeting_id", "position"], name: "index_agenda_items_on_meeting_id_and_position", unique: true
    t.index ["meeting_id"], name: "index_agenda_items_on_meeting_id"
  end

  create_table "ballots", force: :cascade do |t|
    t.bigint "vote_id", null: false
    t.bigint "vote_option_id", null: false
    t.bigint "user_id", null: false
    t.decimal "weight", precision: 10, scale: 2, null: false
    t.datetime "cast_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.index ["user_id"], name: "index_ballots_on_user_id"
    t.index ["vote_id", "user_id"], name: "index_ballots_on_vote_id_and_user_id", unique: true
    t.index ["vote_id"], name: "index_ballots_on_vote_id"
    t.index ["vote_option_id"], name: "index_ballots_on_vote_option_id"
  end

  create_table "condominiums", force: :cascade do |t|
    t.string "name", null: false
    t.string "address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_condominiums_on_name", unique: true
  end

  create_table "meeting_users", force: :cascade do |t|
    t.bigint "meeting_id", null: false
    t.bigint "user_id", null: false
    t.datetime "joined_at", null: false
    t.datetime "left_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["meeting_id", "user_id"], name: "index_meeting_users_on_meeting_id_and_user_id", unique: true
    t.index ["meeting_id"], name: "index_meeting_users_on_meeting_id"
    t.index ["user_id"], name: "index_meeting_users_on_user_id"
  end

  create_table "meetings", force: :cascade do |t|
    t.bigint "condominium_id", null: false
    t.string "title", null: false
    t.datetime "starts_at", null: false
    t.integer "meeting_type", default: 1, null: false
    t.integer "status", default: 0, null: false
    t.datetime "finished_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["condominium_id", "starts_at"], name: "index_meetings_on_condominium_id_and_starts_at"
    t.index ["condominium_id"], name: "index_meetings_on_condominium_id"
  end

  create_table "users", force: :cascade do |t|
    t.bigint "condominium_id", null: false
    t.bigint "proxy_for_id"
    t.bigint "meeting_id"
    t.string "name", null: false
    t.string "email", null: false
    t.integer "role", default: 1, null: false
    t.integer "lots_count", default: 0, null: false
    t.integer "houses_count", default: 0, null: false
    t.decimal "vote_weight", precision: 10, scale: 2, default: "0.0", null: false
    t.boolean "active", default: true, null: false
    t.boolean "delinquent", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "password_digest"
    t.string "access_token"
    t.string "active_session_token"
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.index ["access_token"], name: "index_users_on_access_token", unique: true
    t.index ["condominium_id", "email"], name: "index_users_on_condominium_id_and_email", unique: true
    t.index ["condominium_id"], name: "index_users_on_condominium_id"
    t.index ["meeting_id"], name: "index_users_on_meeting_id"
    t.index ["proxy_for_id"], name: "index_users_on_proxy_for_id"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "vote_options", force: :cascade do |t|
    t.bigint "vote_id", null: false
    t.string "description", null: false
    t.integer "position", default: 1, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["vote_id", "position"], name: "index_vote_options_on_vote_id_and_position", unique: true
    t.index ["vote_id"], name: "index_vote_options_on_vote_id"
  end

  create_table "votes", force: :cascade do |t|
    t.bigint "meeting_id", null: false
    t.bigint "agenda_item_id", null: false
    t.text "statement", null: false
    t.integer "response_type", default: 0, null: false
    t.integer "visibility", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.integer "duration_minutes", default: 2, null: false
    t.datetime "started_at"
    t.datetime "closes_at"
    t.datetime "closed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["agenda_item_id"], name: "index_votes_on_agenda_item_id"
    t.index ["meeting_id"], name: "index_votes_on_meeting_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "agenda_items", "meetings"
  add_foreign_key "ballots", "users"
  add_foreign_key "ballots", "vote_options"
  add_foreign_key "ballots", "votes"
  add_foreign_key "meeting_users", "meetings"
  add_foreign_key "meeting_users", "users"
  add_foreign_key "meetings", "condominiums"
  add_foreign_key "users", "condominiums"
  add_foreign_key "users", "meetings"
  add_foreign_key "users", "users", column: "proxy_for_id"
  add_foreign_key "vote_options", "votes"
  add_foreign_key "votes", "agenda_items"
  add_foreign_key "votes", "meetings"
end
