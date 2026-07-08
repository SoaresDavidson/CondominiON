Rails.application.routes.draw do
  get "/health", to: "health#show"

  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?

  namespace :api do
    namespace :v1 do
      resource :sessions, only: %i[create destroy]
      resources :meeting_accesses, only: :create
      resources :password_resets, only: :create
      patch "password_resets/:token", to: "password_resets#update", as: :password_reset_token

      resources :condominiums do
        resources :meetings, shallow: true do
          member do
            patch :start
            patch :finish
            patch :cancel
            post :join
            post :leave
            post :send_invitations
            get :access_log
            get :managerial_report
          end

          resources :agenda_items, shallow: true
          resources :votes, shallow: true do
            member do
              patch :start
              patch :finish
              get :result
              get :export_pdf
              get :export_xlsx
            end
            resources :vote_options, shallow: true
            resources :ballots, only: %i[index create]
          end
        end

        resources :users, shallow: true
      end

      get "agenda_items/:id/attachment", to: "agenda_items#attachment", as: :agenda_item_attachment
    end
  end
end
