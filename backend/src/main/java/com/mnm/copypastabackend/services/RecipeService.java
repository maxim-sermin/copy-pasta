package com.mnm.copypastabackend.services;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import com.mnm.copypastabackend.entities.Ingredient;
import com.mnm.copypastabackend.entities.Label;
import com.mnm.copypastabackend.entities.Pic;
import com.mnm.copypastabackend.entities.Quantity;
import com.mnm.copypastabackend.entities.Recipe;
import com.mnm.copypastabackend.entities.Step;
import com.mnm.copypastabackend.entities.Unit;
import com.mnm.copypastabackend.entities.User;
import com.mnm.copypastabackend.repositories.IngredientRepository;
import com.mnm.copypastabackend.repositories.LabelRepository;
import com.mnm.copypastabackend.repositories.PicRepository;
import com.mnm.copypastabackend.repositories.QuantityRepository;
import com.mnm.copypastabackend.repositories.RecipeRepository;
import com.mnm.copypastabackend.repositories.StepRepository;
import com.mnm.copypastabackend.repositories.UnitRepository;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RecipeService {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(RecipeService.class);

    @Autowired
    private RecipeRepository recipeRepository;
    @Autowired
    private QuantityRepository quantityRepository;
    @Autowired
    private UnitRepository unitRepository;
    @Autowired
    private IngredientRepository ingredientRepository;
    @Autowired
    private LabelRepository labelRepository;
    @Autowired
    private PicRepository picRepository;
    @Autowired
    private StepRepository stepRepository;
    @Autowired
    private StorageService storageService;

    public Recipe saveNewToDb(Recipe recipe){
        saveOrUpdateLabels(recipe, recipe);
        recipe.setLastModifiedAt(LocalDateTime.now());
        recipe.setLikesAmount(0L);
        Recipe saved = recipeRepository.save(recipe);
        saveOrUpdateQuantities(recipe, saved);
        saveOrUpdateSteps(recipe, saved);

        return saved;
    }

    public void saveOrUpdateSteps(Recipe recipeData, Recipe savedFromDB) {
        // remove the ones which are no longer included
        List<Long> includedStepIds = new ArrayList<>();
        for (Step stepFromDB : savedFromDB.getSteps()) {
            if (isStepNotInList(stepFromDB, recipeData.getSteps())) {
                stepRepository.delete(stepFromDB);
            } else {
                includedStepIds.add(stepFromDB.getId());
            }
        }

        List<Step> savedSteps = new ArrayList<>();

        // add or update the ones that are still included
        int stepIndex = 0;
        for (Step stepData : recipeData.getSteps()) {
            if (stepData.getId() == null || includedStepIds.contains(stepData.getId())) {
                Step stepToUpdate = stepData;
                if (stepData.getId() != null) { // existing step
                    Optional<Step> stepById = stepRepository.findById(stepData.getId());
                    if (stepById.isPresent()) {
                        stepToUpdate = stepById.get();
                    }
                }

                stepToUpdate.setDescription(stepData.getDescription());
                stepToUpdate.setOrdering(stepIndex); // frontend always delivers them in the correct order, without explicit numbering
                stepToUpdate.setRecipe(savedFromDB);
                savedSteps.add(stepRepository.save(stepToUpdate));
                stepIndex++;
            }
        }

        savedFromDB.setSteps(savedSteps);
    }

    public void saveOrUpdateQuantities(Recipe recipeData, Recipe savedFromDB) {
        // remove the ones which are no longer included
        List<Long> includedQuantityIds = new ArrayList<>();
        for (Quantity quantityFromDB : savedFromDB.getQuantities()) {
            if (isQuantityNotInList(quantityFromDB, recipeData.getQuantities())) {
                quantityRepository.delete(quantityFromDB);
            } else {
                includedQuantityIds.add(quantityFromDB.getId());
            }
        }

        List<Quantity> savedQuantities = new ArrayList<>();

        // add or update the ones that are still included
        int quantityIndex = 0;
        for (Quantity quantityData : recipeData.getQuantities()) {
            if (quantityData.getId() == null || includedQuantityIds.contains(quantityData.getId())) {
                Quantity quantityToUpdate = quantityData;
                if (quantityData.getId() != null) { // existing quantity
                    Optional<Quantity> quantityById = quantityRepository.findById(quantityData.getId());
                    if (quantityById.isPresent()) {
                        quantityToUpdate = quantityById.get();
                    }
                }

                Optional<Ingredient> ingredientOptional = ingredientRepository.findByNameIgnoreCase(quantityData.getIngredient().getName());
                Ingredient ingredient;
                if (ingredientOptional.isEmpty()){
                    ingredient = ingredientRepository.save(quantityData.getIngredient());
                } else {
                    ingredient = ingredientOptional.get();
                }
                quantityToUpdate.setIngredient(ingredient);


                Unit unit = null;
                if (quantityData.getAmount() != null) {
                    Optional<Unit> unitOptional = unitRepository.findByNameIgnoreCase(quantityData.getUnit().getName());
                    if (unitOptional.isEmpty()){
                        unit = unitRepository.save(quantityData.getUnit());
                    } else {
                        unit = unitOptional.get();
                    }
                }
                quantityToUpdate.setUnit(unit);
                quantityToUpdate.setAmount(quantityData.getAmount());
                quantityToUpdate.setOptional(quantityData.getOptional());
                quantityToUpdate.setOrdering(quantityIndex); // frontend always delivers them in the correct order, without explicit numbering
                quantityToUpdate.setRecipe(savedFromDB);

                savedQuantities.add(quantityRepository.save(quantityToUpdate));
                quantityIndex++;
            }
        }

        savedFromDB.setQuantities(savedQuantities);
    }

    public void saveOrUpdateLabels(Recipe recipeData, Recipe recipeFromDB) {
        // first we just save the labels from where ever (does not have to be a DB entity)
        Set<Label> savedLabels = new HashSet<>();
        for (Label addedLabel : recipeData.getLabels()) {
            if (savedLabels.stream().noneMatch(label -> label.getId().equals(addedLabel.getId()))) {
                Optional<Label> byName = labelRepository.findByNameIgnoreCase(addedLabel.getName());
                if (byName.isEmpty()) {
                    savedLabels.add(labelRepository.save(addedLabel));
                } else {
                    savedLabels.add(byName.get());
                }
            }
        }

        // then we associate it with the managed DB entity (recipeData and recipeFromDB can be the same)
        recipeFromDB.setLabels(savedLabels);
    }

    public boolean isStepNotInList(Step step, List<Step> list) {
        for (Step stepInList : list) {
            if (stepInList.getId() != null && stepInList.getId().equals(step.getId())) {
                return false;
            }
        }

        return true;
    }

    public boolean isQuantityNotInList(Quantity quantity, List<Quantity> list) {
        for (Quantity quantityInList : list) {
            if (quantityInList.getId() != null && quantityInList.getId().equals(quantity.getId())) {
                return false;
            }
        }

        return true;
    }

    public boolean attachPicToRecipe(InputStream inputStream, long size, String originalFileName, Long recipeId, Integer rotation, User pictureUploader) {
        Optional<Recipe> attachToRecipeOptional = recipeRepository.findById(recipeId);

        if (attachToRecipeOptional.isEmpty()) {
            return false;
        }
        Recipe attachToRecipe = attachToRecipeOptional.get();

        String internalName;
        try {
            internalName = storageService.storeFile(inputStream, size);
        } catch (IOException e) {
            logger.error("Error while writing picture {} of recipe with id {} to disk", originalFileName, recipeId, e);
            return false;
        }

        Pic newPic = new Pic();
        newPic.setInternalUUID(internalName);
        newPic.setName(originalFileName);
        newPic.setRecipe(attachToRecipe);
        newPic.setRotation(rotation);
        newPic.setUploadedBy(pictureUploader);
        picRepository.save(newPic);

        attachToRecipe.setLastModifiedAt(LocalDateTime.now());
        recipeRepository.save(attachToRecipe);

        return true;
    }

    public void deletePictureFromDB(Pic img) {
        picRepository.delete(img);
    }

    public void deleteImage(Pic img) throws IOException {
        storageService.deleteFile(img.getInternalUUID());
    }
}
