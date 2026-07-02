Rails.application.routes.draw do
  get "/health", to: "health#show"

  namespace :api do
    namespace :v1 do
      resources :condominiums do
        resources :meetings, shallow: true do
          member do
            patch :start
            patch :finish
            patch :cancel
            post :join
            post :send_invitations
          end

          resources :agenda_items, shallow: true
          resources :votes, shallow: true do
            member do
              patch :start
              patch :finish
              get :result
            end
            resources :vote_options, shallow: true
            resources :ballots, only: %i[index create]
          end
        end

        resources :users, shallow: true
      end
    end
  end
end
